const crypto = require('crypto');

/**
 * TOTP (RFC 6238) — time-based one-time passwords for 2FA,
 * compatible with Google Authenticator / Authy / 1Password.
 * Implemented with node's built-in crypto (no external lib).
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(str) {
  const clean = String(str).replace(/[\s=]/g, '').toUpperCase();
  let bits = '';
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32 character');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** Cryptographically random base32 secret (160 bits). */
function generateSecret(bytes = 20) {
  return base32Encode(crypto.randomBytes(bytes));
}

/** Compute the 6-digit TOTP code for a given secret at a time window. */
function totpCode(secret, timeStep = 30, windowOffset = 0) {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / timeStep) + windowOffset;
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
  return code;
}

/** Verify a code allowing ±1 time-step of drift (common authenticator behaviour). */
function verifyTOTP(secret, code, windows = 1) {
  const target = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(target)) return false;
  for (let w = -windows; w <= windows; w++) {
    if (totpCode(secret, 30, w) === target) return true;
  }
  return false;
}

/** otpauth:// URL for QR codes / authenticator apps. */
function otpauthUrl(secret, account) {
  const issuer = 'Gurukripa Estate';
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = { generateSecret, totpCode, verifyTOTP, otpauthUrl };
