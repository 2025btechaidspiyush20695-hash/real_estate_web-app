const crypto = require('crypto');

/**
 * Tiny symmetric encryption for the 2FA secret at rest.
 * AES-256-GCM; key is derived (SHA-256) from JWT_SECRET.
 * Format: iv:tag:ciphertext (base64)
 */
function deriveKey() {
  const secret = process.env.JWT_SECRET || 'gurukripa-insecure-default';
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

function decrypt(payload) {
  const [ivB64, tagB64, dataB64] = String(payload).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
