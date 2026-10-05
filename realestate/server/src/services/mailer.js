const nodemailer = require('nodemailer');

/**
 * E-mail service (Nodemailer).
 *
 * SMTP credentials ab DB (settings collection) se aate hain — Admin Panel →
 * Settings → Email/SMTP card se change kiye ja sakte hain. .env sirf
 * FALLBACK hai (fresh install ke liye). Kuch bhi hardcode nahi.
 *
 * GMAIL SETUP:
 *   1. Google Account → Security → 2-Step Verification ON
 *   2. App passwords → create app password for "Mail"
 *   3. Admin Panel → Settings → SMTP card me daalo (user + app password)
 *   4. "Save" + "Send Test Email" se verify karo
 */

/* ---------------- DB-backed SMTP config (cached) ---------------- */
let _smtpCache = null;       // { host, port, secure, user, pass }
let _smtpCacheAt = 0;
let transporter = null;

/** Settings collection se SMTP config load (DB first, .env fallback). */
async function getSmtpConfig() {
  const now = Date.now();
  if (_smtpCache && now - _smtpCacheAt < 60 * 1000) return _smtpCache;
  try {
    const Setting = require('../models/Setting');
    const doc = await Setting.findOne({ key: 'smtp' }).lean();
    if (doc && doc.value && doc.value.user && doc.value.pass) {
      _smtpCache = {
        host: doc.value.host || 'smtp.gmail.com',
        port: Number(doc.value.port || 465),
        secure: String(doc.value.secure === undefined ? true : doc.value.secure) === 'true',
        user: doc.value.user,
        pass: doc.value.pass,
      };
      _smtpCacheAt = now;
      return _smtpCache;
    }
  } catch (e) { /* DB down — env fallback */ }
  // .env fallback (fresh install)
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (SMTP_USER.includes('yourgmail') || SMTP_PASS.includes('your-16-char') || SMTP_PASS.includes('YOUR-16-CHAR')) return null;
  _smtpCache = {
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: String(SMTP_SECURE || 'true') === 'true',
    user: SMTP_USER,
    pass: SMTP_PASS,
  };
  _smtpCacheAt = now;
  return _smtpCache;
}

/** Admin ne SMTP save kiya — cache + transporter reset. */
function clearMailerCache() {
  _smtpCache = null;
  _smtpCacheAt = 0;
  transporter = null;
}

async function getTransporter() {
  if (transporter) return transporter;
  const cfg = await getSmtpConfig();
  if (!cfg) return null;
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  return transporter;
}

/** Safe sender: hamesha SMTP user ka email — Gmail kisi aur from address ko reject karta hai. */
async function getFrom() {
  const cfg = await getSmtpConfig();
  const smtpUser = cfg ? cfg.user : (process.env.SMTP_USER || 'no-reply@gurukripa.in');
  const siteName = process.env.BRAND_NAME || 'Gurukripa Estate';
  const raw = process.env.EMAIL_FROM || '';
  const m = raw.match(/<([^>]+)>/);
  let email = m ? m[1] : '';
  if (!email || email === 'autofill' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    email = smtpUser;
  }
  return `${siteName} <${email}>`;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Sends the password-reset email containing:
 *   1. a 6-digit OTP (primary, entered on the admin login page)
 *   2. a one-time reset link (secondary)
 * @returns {Promise<{resetUrl:string, otp:string}|null>} devInfo in dev mode, null when a real e-mail was sent
 */
async function sendPasswordResetEmail(email, token, otp) {
  const adminUrl = (process.env.ADMIN_URL || 'http://localhost:5174').replace(/\/$/, '');
  const resetUrl = `${adminUrl}/reset/${token}`;
  const siteName = process.env.BRAND_NAME || 'Gurukripa Estate';

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e4e8ef;border-radius:16px;overflow:hidden">
    <div style="background:#0f1e3d;padding:22px 28px;color:#fff">
      <div style="font-size:20px;font-weight:700;letter-spacing:2px">🏠 ${siteName}</div>
      <div style="opacity:.7;font-size:12px;letter-spacing:2px">ADMIN PANEL · PASSWORD RESET</div>
    </div>
    <div style="padding:28px;background:#ffffff;color:#16181d">
      <p style="margin:0 0 6px;font-size:17px;font-weight:700">Password reset requested</p>
      <p style="margin:0 0 18px;color:#6b7280;font-size:14px">Aapka OTP neeche hai — 10 minute me use karein.</p>
      <div style="background:#f6f8fb;border:1px solid #e6eaf0;border-radius:12px;padding:18px;text-align:center">
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f1e3d">${otp}</div>
      </div>
      <p style="text-align:center;margin:18px 0 6px;font-size:13px;color:#6b7280">Ya seedha link kholo:</p>
      <p style="text-align:center;margin:0 0 20px">
        <a href="${resetUrl}" style="display:inline-block;background:#1a56db;color:#fff;text-decoration:none;padding:11px 26px;border-radius:999px;font-weight:700">Reset Password</a>
      </p>
      <p style="font-size:12px;color:#8a93a3;text-align:center">Agar aapne request nahi ki thi, is email ko ignore kar dein.</p>
    </div>
  </div>`;

  const mailer = await getTransporter();
  if (!mailer) {
    // dev mode — OTP/link console me, taaki flow test ho sake
    console.log('\n[mail] DEV MODE — password reset for', email, '\n       OTP:', otp, '\n       Link:', resetUrl, '\n');
    return { resetUrl, otp };
  }
  await mailer.sendMail({
    from: await getFrom(),
    to: email,
    subject: `🔐 ${siteName} — Password Reset OTP`,
    html,
  });
  return null;
}

/**
 * NEW ENQUIRY EMAIL — admin ke email pe "You have a new enquiry" + saare details.
 * Recipient = current admin (DB se, notifier pass karta hai).
 */
async function sendAdminNotificationEmail(enquiry, toEmail) {
  const to = toEmail || process.env.SMTP_USER || '';
  if (!to) {
    console.warn('[mail] ⚠️ recipient email nahi mila — DB me admin user check karo');
    return;
  }
  const siteName = process.env.BRAND_NAME || 'Gurukripa Estate';
  const adminUrl = (process.env.ADMIN_URL || 'http://localhost:5174').replace(/\/$/, '');

  const reqRows = [
    enquiry.requirementType && ['Property Type', enquiry.requirementType],
    enquiry.requirementCity && ['City / Area', enquiry.requirementCity],
    enquiry.budget && ['Budget', enquiry.budget],
    enquiry.bedrooms && ['Bedrooms', `${enquiry.bedrooms} BHK`],
    enquiry.timeline && ['Timeline', enquiry.timeline],
  ].filter(Boolean);

  const row = (label, value, bold = false) => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #eef0f4;color:#6b7280;font-size:13px;width:38%">${esc(label)}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #eef0f4;color:#16181d;font-size:14px;font-weight:${bold ? '700' : '500'}">${esc(value)}</td>
    </tr>`;

  const reqBlock = reqRows.length
    ? `<table style="width:100%;border-collapse:collapse;margin:14px 0">${reqRows.map(([l, v]) => row(l, v)).join('')}</table>`
    : '';

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e4e8ef;border-radius:16px;overflow:hidden">
    <div style="background:#0f1e3d;padding:24px 28px;color:#fff">
      <div style="font-size:20px;font-weight:700;letter-spacing:2px">🏠 ${siteName}</div>
      <div style="opacity:.7;font-size:12px;letter-spacing:2px">NEW ENQUIRY NOTIFICATION</div>
    </div>
    <div style="padding:28px;background:#ffffff;color:#16181d">
      <p style="margin:0 0 6px;font-size:18px;font-weight:700">📩 You have a new enquiry</p>
      <p style="margin:0 0 18px;color:#6b7280;font-size:14px">
        ${enquiry.requirementType ? 'A new property requirement' : 'A visitor has submitted an enquiry'} on your website.
      </p>

      <table style="width:100%;border-collapse:collapse;border:1px solid #eef0f4;border-radius:10px;overflow:hidden">
        ${row('Name', enquiry.name, true)}
        ${row('Phone', enquiry.phone, true)}
        ${enquiry.email ? row('Email', enquiry.email) : ''}
        ${enquiry.propertyTitle ? row('Property', enquiry.propertyTitle, true) : ''}
        ${enquiry.message ? row('Message', enquiry.message) : ''}
        ${reqRows.length ? row('Requirement', reqRows.map(([, v]) => v).join(' · '), true) : ''}
        ${row('Time', new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}
      </table>

      ${reqBlock}

      <p style="text-align:center;margin:24px 0 0">
        <a href="${adminUrl}/enquiries" style="display:inline-block;background:#1a56db;color:#fff;text-decoration:none;padding:12px 30px;border-radius:999px;font-weight:700">Open Leads &amp; Enquiries</a>
      </p>
      <p style="text-align:center;margin:14px 0 0;font-size:12px;color:#6b7280">
        In-app notification bhi aa chuki hogi — ye email backup ke liye hai.
      </p>
    </div>
  </div>`;

  const mailer = await getTransporter();
  if (!mailer) {
    console.log('\n[mail] DEV MODE — enquiry email for', to, ':\n       Name:', enquiry.name, '| Phone:', enquiry.phone, '\n');
    return;
  }

  await mailer.sendMail({
    from: await getFrom(),
    to,
    subject: `📩 New Enquiry — ${enquiry.name} (${enquiry.phone})`,
    html,
  });
}

/**
 * TEST EMAIL — Settings me "Send Test Email" button se chalega.
 * Real send karta hai (ya exact error wapas karta hai).
 */
async function sendTestEmail(toEmail) {
  const to = toEmail || process.env.SMTP_USER || '';
  const mailer = await getTransporter();
  if (!mailer) {
    return { ok: false, devMode: true, message: 'SMTP setup nahi hua — Admin Panel → Settings → Email/SMTP card me apna Gmail + 16-char app password daalo.' };
  }
  try {
    await mailer.sendMail({
      from: await getFrom(),
      to,
      subject: '✅ Test Email — Gurukripa Estate SMTP working',
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e4e8ef;border-radius:16px;overflow:hidden">
        <div style="background:#0f1e3d;padding:22px 28px;color:#fff">
          <div style="font-size:20px;font-weight:700;letter-spacing:2px">🏠 Gurukripa Estate</div>
          <div style="opacity:.7;font-size:12px;letter-spacing:2px">SMTP TEST</div>
        </div>
        <div style="padding:28px;background:#fff;color:#16181d">
          <p style="margin:0 0 8px;font-size:18px;font-weight:700">✅ Email setup bilkul sahi kaam kar raha hai!</p>
          <p style="margin:0;color:#6b7280;font-size:14px">Yeh test email <b>${to}</b> pe aayi hai. Ab website se enquiry bhejo — har enquiry par aisi hi email aayegi.</p>
        </div>
      </div>`,
    });
    return { ok: true, to, message: `Test email bhej di gayi to ${to} (Spam folder check karna, agar inbox me na dikhe)` };
  } catch (err) {
    const code = err.code || '';
    let hint = '';
    if (code === 'EAUTH' || /535|534|invalid login|bad credentials/i.test(String(err.message || ''))) {
      hint = '❌ Gmail ne password reject kiya — sahi 16-char APP PASSWORD daalo (aapka Gmail password nahi!). 2-Step Verification ON karke Google Account → Security → App passwords se naya banao. Aur check karo ki app password USI Gmail ka hai jo SMTP user me likha hai.';
    } else if (code === 'ESOCKET' || /connect|ECONN/i.test(String(err.message || ''))) {
      hint = '❌ Internet/Gmail server se connection nahi hua — internet check karo, ya firewall/antivirus SMTP 465 block kar raha hai.';
    } else if (/sender|from|553|501/i.test(String(err.message || ''))) {
      hint = '❌ Sender address invalid — SMTP user sahi set karo.';
    }
    console.error('[mail] test email failed:', err.message);
    return { ok: false, message: hint || ('❌ Email bhejne me error: ' + (err.message || 'unknown')) };
  }
}

module.exports = { sendPasswordResetEmail, sendAdminNotificationEmail, sendTestEmail, getSmtpConfig, clearMailerCache };
