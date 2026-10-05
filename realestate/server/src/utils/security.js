const crypto = require('crypto');

/** Email format check (basic but effective). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Strong password policy:
 *  - minimum 8 characters
 *  - at least 1 uppercase letter
 *  - at least 1 number
 *  - at least 1 special character
 */
const STRONG_PW_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** SHA-256 hex digest (used to store reset tokens hashed — never plaintext). */
function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/** Cryptographically strong random token (256-bit hex). */
function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

/** Returns null if the password is strong, otherwise an error message. */
function validateStrongPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
  if (!/\d/.test(pw)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character';
  return null;
}

/** Mask an email for display: ra****@domain.com */
function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  const head = name && name.length > 2 ? name.slice(0, 2) : '**';
  return `${head}***@${domain || ''}`;
}

module.exports = {
  EMAIL_RE,
  STRONG_PW_RE,
  normalizeEmail,
  sha256,
  randomToken,
  validateStrongPassword,
  maskEmail,
};
