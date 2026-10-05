const mongoose = require('mongoose');

/**
 * One-time security codes (OTP) for:
 *  - password reset (purpose: 'reset')
 *  - two-factor fallback (purpose: '2fa') — reserved
 *
 * Security:
 *  - codeHash stores SHA-256 of the 6-digit code (never plaintext)
 *  - expiresAt drives a TTL index (auto-delete after expiry)
 *  - attempts capped at 5 per code
 *  - used flag prevents replay; code is deleted after successful use
 */
const otpCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ['reset'], default: 'reset' },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpCode', otpCodeSchema);
