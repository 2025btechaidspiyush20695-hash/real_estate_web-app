const crypto = require('crypto');

/**
 * Simple server-side math CAPTCHA (no external service needed).
 * The answer is stored ONLY as a SHA-256 hash with a 5-minute expiry,
 * so even a database/memory dump cannot reveal it.
 *
 * The SVG question is rendered as plain <text>, so real users (and
 * accessibility tools) can read it, while basic bots are deterred.
 * Combined with rate-limiting + account lockout this is a solid
 * human check for a single-admin panel.
 */

const store = new Map(); // captchaId -> { hash, expiresAt }
const TTL = 5 * 60 * 1000;
const MAX_CAPTCHAS = 500; // memory guard

function cleanup() {
  const now = Date.now();
  for (const [id, rec] of store) {
    if (rec.expiresAt < now) store.delete(id);
  }
  if (store.size > MAX_CAPTCHAS) {
    const oldest = [...store.keys()].slice(0, store.size - MAX_CAPTCHAS);
    oldest.forEach((k) => store.delete(k));
  }
}

/** Generate a new captcha: returns { id, svg }. */
function newCaptcha() {
  cleanup();
  const a = crypto.randomInt(2, 20);
  const b = crypto.randomInt(2, 20);
  const op = crypto.randomInt(2) === 0 ? '+' : '-';
  const answer = op === '+' ? a + b : a - b;
  const question = `${a} ${op} ${b} = ?`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="48" viewBox="0 0 150 48">` +
    `<rect width="150" height="48" rx="10" fill="#f6f1e4"/>` +
    `<rect x="6" y="6" width="138" height="36" rx="7" fill="none" stroke="#e6dbc0" stroke-width="1.5"/>` +
    // subtle noise lines (human-readable, bot-annoying)
    `<line x1="18" y1="14" x2="132" y2="36" stroke="#d8cba8" stroke-width="1" opacity="0.55"/>` +
    `<line x1="30" y1="38" x2="126" y2="12" stroke="#d8cba8" stroke-width="1" opacity="0.55"/>` +
    `<circle cx="20" cy="30" r="2" fill="#c9a24b" opacity="0.5"/>` +
    `<circle cx="130" cy="16" r="2" fill="#c9a24b" opacity="0.5"/>` +
    `<text x="75" y="30" text-anchor="middle" font-family="monospace" font-size="19" font-weight="bold" fill="#0f4c43">${question}</text>` +
    `</svg>`;

  const id = crypto.randomBytes(16).toString('hex');
  store.set(id, { hash: sha256(String(answer)), expiresAt: Date.now() + TTL });
  return { id, svg };
}

/** Verify a captcha answer. Always consumed (one-time). */
function verifyCaptcha(id, answer) {
  if (!id || answer === undefined || answer === null) return false;
  const rec = store.get(id);
  if (!rec) return false;
  store.delete(id); // one-time use
  if (rec.expiresAt < Date.now()) return false;
  return sha256(String(answer).trim()) === rec.hash;
}

function sha256(v) {
  return crypto.createHash('sha256').update(String(v)).digest('hex');
}

module.exports = { newCaptcha, verifyCaptcha };
