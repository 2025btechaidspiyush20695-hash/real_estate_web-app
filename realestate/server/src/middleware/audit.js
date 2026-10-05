const AuditLog = require('../models/AuditLog');

/**
 * Write an entry to the audit trail. Never throws — logging must
 * never break a request.
 */
async function logAudit(user, action, details = {}, req = null) {
  try {
    await AuditLog.create({
      userId: user ? user.id || user._id : null,
      action,
      details,
      ip: req ? (req.ip || '').replace('::ffff:', '') : '',
      userAgent: req ? String(req.get('user-agent') || '').slice(0, 220) : '',
    });
  } catch (err) {
    console.error('[audit] write failed:', err.message);
  }
}

module.exports = { logAudit };
