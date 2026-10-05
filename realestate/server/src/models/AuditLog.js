const mongoose = require('mongoose');

/**
 * Audit trail — every sensitive action in the admin panel is logged:
 * logins, failed logins, password changes, ownership transfer,
 * 2FA changes, content/property edits, uploads, etc.
 * (Viewable in the admin panel → Activity Log)
 */
const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
