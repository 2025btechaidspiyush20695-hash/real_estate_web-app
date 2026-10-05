const mongoose = require('mongoose');

/**
 * One-time password reset tokens.
 * - tokenHash stores the SHA-256 of the raw token (never the raw token itself)
 * - expiresAt drives a MongoDB TTL index so expired rows auto-delete
 * - `used` flag is a second line of defence against replay
 */
const passwordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL: Mongo automatically removes documents after `expiresAt`
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
