const router = require('express').Router();
const Setting = require('../models/Setting');
const { sendTestEmail, getSmtpConfig, clearMailerCache } = require('../services/mailer');
const { logAudit } = require('../middleware/audit');

const HOST_RE = /^[a-z0-9.-]+$/i;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Mask email: a***@gmail.com — password kabhi wapas nahi bhejte. */
function maskEmail(e) {
  if (!e) return '';
  const [u, d] = e.split('@');
  if (!d) return '***';
  return u.slice(0, 2) + '***@' + d;
}

// GET /api/settings/smtp — current config (password masked)
router.get('/smtp', async (req, res) => {
  try {
    const cfg = await getSmtpConfig();
    res.json({
      configured: !!cfg,
      host: cfg ? cfg.host : '',
      port: cfg ? cfg.port : 465,
      secure: cfg ? cfg.secure : true,
      user: cfg ? maskEmail(cfg.user) : '',
      hasPass: cfg ? !!cfg.pass : false,
      source: 'db', // sab kuch DB se — .env sirf fresh-install fallback
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/settings/smtp — save SMTP config (DB me — .env chhune ki zaroorat nahi)
router.put('/smtp', async (req, res) => {
  try {
    const { host, port, secure, user, pass } = req.body || {};
    if (!host || !HOST_RE.test(host)) return res.status(400).json({ message: 'Valid SMTP host chahiye (e.g. smtp.gmail.com)' });
    if (!user || !EMAIL_RE.test(user)) return res.status(400).json({ message: 'Valid SMTP user email chahiye' });
    if (!pass || pass.length < 8) return res.status(400).json({ message: 'App password chahiye (16 characters, bina space)' });

    const existing = await Setting.findOne({ key: 'smtp' });
    const value = {
      host,
      port: Number(port || 465),
      secure: secure === undefined ? true : !!secure,
      user: String(user).trim().toLowerCase(),
      pass: String(pass).trim(),
    };
    if (existing) {
      existing.value = value;
      await existing.save();
    } else {
      await Setting.create({ key: 'smtp', value });
    }
    clearMailerCache();
    await logAudit(req.user, 'smtp.updated', { host, user: maskEmail(value.user) }, req);
    res.json({ ok: true, message: 'SMTP settings save ho gayi. Ab "Send Test Email" dabao.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/settings/smtp/test — saved config se real test email
router.post('/smtp/test', async (req, res) => {
  try {
    const result = await sendTestEmail(req.user.email);
    await logAudit(req.user, 'email.test', { to: req.user.email, ok: result.ok }, req);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
