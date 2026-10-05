const crypto = require('crypto');
const OtpCode = require('../models/OtpCode');
const { sha256 } = require('../utils/security');

const MAX_ATTEMPTS = 5;

/** Create a fresh 6-digit OTP for an email+purpose (replaces any previous). Returns the plaintext code (for emailing). */
async function createOtp(email, purpose = 'reset', ttlMin = 10) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await OtpCode.deleteMany({ email, purpose });
  await OtpCode.create({
    email,
    purpose,
    codeHash: sha256(code),
    expiresAt: new Date(Date.now() + ttlMin * 60 * 1000),
  });
  return code;
}

/**
 * Verify a code. Consumes attempts; returns one of:
 *   { ok: true }
 *   { ok: false, reason: 'invalid' | 'expired' | 'used' | 'too-many-attempts' }
 */
async function verifyOtp(email, purpose, code) {
  const doc = await OtpCode.findOne({ email, purpose });
  if (!doc) return { ok: false, reason: 'invalid' };
  if (doc.used) return { ok: false, reason: 'used' };
  if (doc.expiresAt < new Date()) return { ok: false, reason: 'expired' };
  if (doc.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'too-many-attempts' };

  if (sha256(String(code || '').trim()) !== doc.codeHash) {
    doc.attempts += 1;
    await doc.save();
    return { ok: false, reason: 'invalid' };
  }

  // Success → mark used and remove all codes for this email+purpose
  await OtpCode.deleteMany({ email, purpose });
  return { ok: true };
}

module.exports = { createOtp, verifyOtp, MAX_ATTEMPTS };
