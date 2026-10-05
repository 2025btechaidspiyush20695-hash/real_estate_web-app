const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const auth = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const {
  EMAIL_RE,
  normalizeEmail,
  sha256,
  randomToken,
  validateStrongPassword,
  maskEmail,
} = require('../utils/security');
const { sendPasswordResetEmail } = require('../services/mailer');
const { clearAdminEmailCache } = require('../services/notifier');
const { createOtp, verifyOtp } = require('../services/otp');
const { newCaptcha, verifyCaptcha } = require('../utils/captcha');
const { generateSecret, verifyTOTP, otpauthUrl } = require('../utils/totp');
const { encrypt, decrypt } = require('../utils/crypto-box');

const RESET_TTL_MIN = () => Number(process.env.RESET_TOKEN_TTL_MIN || 15);
const CAPTCHA_REQUIRED_AFTER = Number(process.env.CAPTCHA_REQUIRED_AFTER || 2);
const LOCKOUT_AFTER = Number(process.env.LOCKOUT_AFTER || 5);
const LOCKOUT_MIN = Number(process.env.LOCKOUT_MIN || 15);

/* ------------------------------------------------------------------
   In-memory brute-force protection (per email):
   failures[email] = { count, lockedUntil }
   ------------------------------------------------------------------ */
const failures = new Map();
function recordFailure(email) {
  const rec = failures.get(email) || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= LOCKOUT_AFTER) {
    rec.lockedUntil = Date.now() + LOCKOUT_MIN * 60 * 1000;
    rec.count = 0; // reset counter; lock is now active
  }
  failures.set(email, rec);
  return rec;
}
function clearFailures(email) {
  failures.delete(email);
}
function lockInfo(email) {
  const rec = failures.get(email);
  if (!rec) return null;
  if (rec.lockedUntil > Date.now()) {
    return { locked: true, until: rec.lockedUntil, minutes: Math.ceil((rec.lockedUntil - Date.now()) / 60000) };
  }
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) failures.delete(email);
  return rec ? { locked: false, count: rec.count } : null;
}

/* ================================================================
   CAPTCHA
   ================================================================ */
// GET /api/auth/captcha
router.get('/captcha', (req, res) => {
  const { id, svg } = newCaptcha();
  res.json({ captchaId: id, svg });
});

/* ================================================================
   LOGIN (password + progressive CAPTCHA + optional 2FA)
   ================================================================ */
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, captchaId, captchaAnswer } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const targetEmail = normalizeEmail(email);
    const lock = lockInfo(targetEmail);
    if (lock && lock.locked) {
      await logAudit(null, 'login.locked', { email: targetEmail }, req);
      return res.status(423).json({
        message: `Too many failed attempts. Try again after ${lock.minutes} minute(s).`,
        lockedUntil: lock.until,
      });
    }

    // Progressive CAPTCHA: required after a few failed attempts
    const fails = lock ? lock.count : 0;
    if (fails >= CAPTCHA_REQUIRED_AFTER) {
      if (!verifyCaptcha(captchaId, captchaAnswer)) {
        const { id, svg } = newCaptcha();
        return res.status(400).json({
          message: 'Please solve the captcha correctly.',
          captchaRequired: true,
          captchaId: id,
          svg,
        });
      }
    }

    const user = await User.findOne({ email: targetEmail }).select('+password +twoFactorSecret');
    // Generic message — never reveal whether the email exists
    if (!user || !(await user.comparePassword(password))) {
      recordFailure(targetEmail);
      await logAudit(null, 'login.failed', { email: targetEmail }, req);
      const cur = lockInfo(targetEmail);
      if (cur && cur.locked) {
        await logAudit(null, 'login.locked', { email: targetEmail, minutes: cur.minutes }, req);
      }
      const lockMsg = cur && cur.locked
        ? ` Too many attempts — locked for ${cur.minutes} minute(s).`
        : '';
      const resp = { message: 'Invalid email or password.' + lockMsg, captchaRequired: fails + 1 >= CAPTCHA_REQUIRED_AFTER };
      if (resp.captchaRequired) {
        const { id, svg } = newCaptcha();
        resp.captchaId = id;
        resp.svg = svg;
      }
      return res.status(401).json(resp);
    }

    // ── Password OK ──
    clearFailures(targetEmail);
    await logAudit(user, 'login.success', { email: user.email }, req);

    // 2FA enabled → issue a short-lived "pending" token, NOT a session
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const pendingToken = jwt.sign(
        { sub: user._id.toString(), ver: user.tokenVersion || 0, purpose: '2fa' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        require2fa: true,
        pendingToken,
        user: user.toSafeJSON(),
      });
    }

    user.lastLoginAt = new Date();
    await user.save();
    const token = jwt.sign(
      { sub: user._id.toString(), ver: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '12h' }
    );
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================================================================
   2FA VERIFICATION (second step of login)
   ================================================================ */
// POST /api/auth/verify-2fa  { pendingToken, code }
router.post('/verify-2fa', async (req, res) => {
  try {
    const { pendingToken, code } = req.body || {};
    if (!pendingToken || !code) return res.status(400).json({ message: 'Code is required' });

    let payload;
    try {
      payload = jwt.verify(pendingToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: '2FA session expired — please login again.' });
    }
    if (payload.purpose !== '2fa') return res.status(401).json({ message: 'Invalid token' });

    const user = await User.findById(payload.sub).select('+twoFactorSecret');
    if (!user) return res.status(401).json({ message: 'Account not found' });
    if (payload.ver !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session revoked — please login again.' });
    }
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA is not enabled on this account.' });
    }

    const secret = decrypt(user.twoFactorSecret);
    if (!verifyTOTP(secret, code)) {
      await logAudit(user, 'login.2fa_failed', {}, req);
      return res.status(401).json({ message: 'Invalid authenticator code.' });
    }

    user.lastLoginAt = new Date();
    await user.save();
    await logAudit(user, 'login.2fa_ok', {}, req);

    const token = jwt.sign(
      { sub: user._id.toString(), ver: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '12h' }
    );
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json({ user: req.user }));

/* ================================================================
   2FA SETUP (admin panel → Settings)
   ================================================================ */
// GET /api/auth/2fa/setup  (auth) — returns secret + QR code
router.get('/2fa/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    let secret = user.twoFactorSecret ? decrypt(user.twoFactorSecret) : generateSecret();
    user.twoFactorSecret = encrypt(secret); // persist (safe even if already set)
    await user.save();

    const url = otpauthUrl(secret, user.email);
    const qrcode = require('qrcode');
    const qr = await qrcode.toDataURL(url, { margin: 1, width: 240, color: { dark: '#0f4c43', light: '#fffdf7' } });
    res.json({ secret, otpauthUrl: url, qr });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/2fa/enable  (auth)  { code, password }
router.post('/2fa/enable', auth, async (req, res) => {
  try {
    const { code, password } = req.body || {};
    if (!code || !password) return res.status(400).json({ message: 'Password and authenticator code are required' });

    const user = await User.findById(req.user.id).select('+password +twoFactorSecret');
    if (!(await user.comparePassword(password))) {
      await logAudit(user, '2fa.enable_failed', { reason: 'wrong password' }, req);
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    if (!user.twoFactorSecret) return res.status(400).json({ message: 'Generate a setup code first (reload the page).' });

    const secret = decrypt(user.twoFactorSecret);
    if (!verifyTOTP(secret, code)) {
      await logAudit(user, '2fa.enable_failed', { reason: 'wrong code' }, req);
      return res.status(401).json({ message: 'Invalid authenticator code. Check the code in your app.' });
    }

    user.twoFactorEnabled = true;
    await user.save();
    await logAudit(user, '2fa.enabled', {}, req);
    res.json({ message: '2FA enabled. From now on, login requires your authenticator code.', twoFactorEnabled: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/2fa/disable  (auth)  { code, password }
router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const { code, password } = req.body || {};
    if (!code || !password) return res.status(400).json({ message: 'Password and authenticator code are required' });

    const user = await User.findById(req.user.id).select('+password +twoFactorSecret');
    if (!(await user.comparePassword(password))) {
      await logAudit(user, '2fa.disable_failed', { reason: 'wrong password' }, req);
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const secret = decrypt(user.twoFactorSecret);
      if (!verifyTOTP(secret, code)) {
        await logAudit(user, '2fa.disable_failed', { reason: 'wrong code' }, req);
        return res.status(401).json({ message: 'Invalid authenticator code.' });
      }
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();
    await logAudit(user, '2fa.disabled', {}, req);
    res.json({ message: '2FA disabled.', twoFactorEnabled: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================================================================
   CHANGE OWN PASSWORD (also revokes all sessions)
   ================================================================ */
// PUT /api/auth/password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords are required' });

    const pwError = validateStrongPassword(newPassword);
    if (pwError) return res.status(400).json({ message: pwError });

    const user = await User.findById(req.user.id).select('+password +passwordHistory');
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

    if (await user.isPasswordReused(newPassword)) {
      return res.status(400).json({ message: 'You have used this password before. Please choose a new one.' });
    }

    user.password = newPassword; // pre-save hook hashes + history
    user.tokenVersion = (user.tokenVersion || 0) + 1; // kill all sessions
    await user.save();
    await logAudit(user, 'password.changed', {}, req);
    res.json({ message: 'Password updated. You have been logged out of all devices — please login again.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================================================================
   COMPONENT 1 — OWNERSHIP TRANSFER
   ================================================================ */
// POST /api/auth/transfer
router.post('/transfer', auth, async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword, confirmNewPassword } = req.body || {};

    if (!currentPassword || !newEmail || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    if (!EMAIL_RE.test(normalizeEmail(newEmail))) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    const pwError = validateStrongPassword(newPassword);
    if (pwError) return res.status(400).json({ message: pwError });

    const user = await User.findById(req.user.id).select('+password +passwordHistory');
    if (!user) return res.status(401).json({ message: 'Account not found' });
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

    const targetEmail = normalizeEmail(newEmail);
    const existing = await User.findOne({ email: targetEmail, _id: { $ne: user._id } });
    if (existing) return res.status(400).json({ message: 'This email is already in use by another account' });

    if (await user.isPasswordReused(newPassword)) {
      return res.status(400).json({ message: 'This password was used before. Please choose a new one.' });
    }

    const oldEmail = user.email;
    user.email = targetEmail;
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // REVOKE ALL SESSIONS
    user.twoFactorEnabled = false; // new owner must set up their own 2FA
    user.twoFactorSecret = null;
    await PasswordReset.deleteMany({ email: { $in: [oldEmail, targetEmail] } });

    await user.save();

    /* ============ PURANA EMAIL KA KOI NISHAN NA BACHE ============
       1. Purane email par bana koi duplicate user account delete */
    await User.deleteMany({ email: oldEmail, _id: { $ne: user._id } });
    /* 2. Purane email se jude OTP codes + reset tokens delete */
    try {
      const OtpCode = require('../models/OtpCode');
      await OtpCode.deleteMany({ email: oldEmail });
    } catch (e) { /* non-fatal */ }
    /* 3. Audit logs me purane email ka zikr delete (koi trace na rahe) */
    const AuditLog = require('../models/AuditLog');
    await AuditLog.deleteMany({
      $or: [
        { 'details.email': { $regex: new RegExp('^' + oldEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } },
        { 'details.from': { $regex: new RegExp('^' + oldEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } },
        { 'details.to': { $regex: new RegExp('^' + oldEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } },
      ],
    });
    /* 4. Email-recipient cache clear — ab naye email pe jayega */
    clearAdminEmailCache();
    /* 5. Transfer ki entry bhi bina purane email ke (sirf naya email) */
    await logAudit(user, 'ownership.transferred', { to: targetEmail }, req);

    res.json({
      message: 'Ownership transferred successfully. Purana email poori tarah hata diya gaya — all sessions terminated. Login with the new credentials.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================================================================
   FORGOT PASSWORD — OTP FLOW (primary) + reset link (secondary)
   ================================================================ */

// ---- Step A/B/C: request reset → email OTP + link ----
// POST /api/auth/forgot
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_RE.test(normalizeEmail(email))) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    const targetEmail = normalizeEmail(email);
    const user = await User.findOne({ email: targetEmail });

    // Generic response regardless — prevents account enumeration
    if (user) {
      const token = randomToken(); // link flow (secondary)
      await PasswordReset.create({
        email: targetEmail,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MIN() * 60 * 1000),
      });
      const otp = await createOtp(targetEmail, 'reset', RESET_TTL_MIN()); // OTP flow (primary)

      const devInfo = await sendPasswordResetEmail(targetEmail, token, otp);
      if (devInfo) res.locals.devInfo = devInfo; // { resetUrl, otp }
      await logAudit(null, 'forgot.requested', { email: targetEmail }, req);
    }

    res.json({
      message: `If an account exists for that email, a 6-digit OTP and a secure link (valid ${RESET_TTL_MIN()} minutes) have been sent.`,
      ...(res.locals.devInfo || {}),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- OTP verify: returns a short-lived reset token ----
// POST /api/auth/verify-otp  { email, otp }
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    const targetEmail = normalizeEmail(email);

    const result = await verifyOtp(targetEmail, 'reset', otp);
    if (!result.ok) {
      const reasons = {
        invalid: 'Invalid OTP. Please check the code from your email.',
        expired: 'This OTP has expired. Please request a new one.',
        used: 'This OTP has already been used.',
        'too-many-attempts': 'Too many wrong attempts. Please request a new OTP.',
      };
      return res.status(400).json({ message: reasons[result.reason] || 'Invalid OTP.' });
    }

    const user = await User.findOne({ email: targetEmail });
    if (!user) return res.status(400).json({ message: 'Account not found. Please request a new OTP.' });

    // Short-lived, single-purpose token (5 min) — only for password reset
    const resetToken = jwt.sign(
      { sub: user._id.toString(), ver: user.tokenVersion || 0, purpose: 'reset-otp' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
    await logAudit(user, 'otp.verified', { email: user.email }, req);
    res.json({ resetToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Set new password with the OTP-verified token ----
// POST /api/auth/reset-otp  { resetToken, newPassword, confirmNewPassword }
router.post('/reset-otp', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmNewPassword } = req.body || {};
    if (!resetToken || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword !== confirmNewPassword) return res.status(400).json({ message: 'Passwords do not match' });
    const pwError = validateStrongPassword(newPassword);
    if (pwError) return res.status(400).json({ message: pwError });

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Reset session expired. Please request a new OTP.' });
    }
    if (payload.purpose !== 'reset-otp') return res.status(401).json({ message: 'Invalid reset token' });

    const user = await User.findById(payload.sub).select('+password +passwordHistory');
    if (!user) return res.status(400).json({ message: 'Account not found.' });

    if (await user.isPasswordReused(newPassword)) {
      return res.status(400).json({ message: 'This password was used before. Please choose a new one.' });
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // invalidate all sessions
    await user.save();
    await OtpCleanup(user.email);
    await logAudit(user, 'password.reset_otp', {}, req);
    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete any lingering OTPs for an email after reset
async function OtpCleanup(email) {
  const OtpCode = require('../models/OtpCode');
  try { await OtpCode.deleteMany({ email }); } catch (e) {}
}

/* ================================================================
   LEGACY LINK FLOW (still supported for emailed reset links)
   ================================================================ */

// GET /api/auth/reset/:token
router.get('/reset/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const doc = await PasswordReset.findOne({
      tokenHash: sha256(token),
      used: false,
      expiresAt: { $gt: new Date() },
    });
    if (!doc) return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' });
    res.json({ valid: true, email: maskEmail(doc.email) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset/:token
router.post('/reset/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body || {};

    if (!newPassword || !confirmNewPassword) return res.status(400).json({ message: 'All fields are required' });
    if (newPassword !== confirmNewPassword) return res.status(400).json({ message: 'Passwords do not match' });
    const pwError = validateStrongPassword(newPassword);
    if (pwError) return res.status(400).json({ message: pwError });

    const doc = await PasswordReset.findOne({
      tokenHash: sha256(token),
      used: false,
      expiresAt: { $gt: new Date() },
    });
    if (!doc) return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' });

    const user = await User.findOne({ email: doc.email }).select('+password +passwordHistory');
    if (!user) return res.status(400).json({ message: 'Account not found. Please request a new link.' });

    if (await user.isPasswordReused(newPassword)) {
      return res.status(400).json({ message: 'This password was used before. Please choose a new one.' });
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await PasswordReset.deleteMany({ email: doc.email });
    await OtpCleanup(doc.email);
    await logAudit(user, 'password.reset_link', {}, req);
    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
