const { EventEmitter } = require('events');
const Notification = require('../models/Notification');
const { sendAdminNotificationEmail } = require('./mailer');

/**
 * Real-time notification bus.
 *  - notifyEnquiry(): creates a DB notification, pushes it live to any
 *    connected admin panel (SSE) and sends a best-effort email.
 *  - SSE clients register via addClient() and receive 'init' + 'new-enquiry'
 *    events.
 */
const emitter = new EventEmitter();
const sseClients = new Set();

/* ---- Dynamic admin email: DB se hamesha CURRENT admin user ka email ---- */
let _adminEmailCache = null;
let _adminEmailAt = 0;

async function getAdminEmail() {
  const now = Date.now();
  if (_adminEmailCache && now - _adminEmailAt < 2 * 60 * 1000) return _adminEmailCache;
  try {
    const User = require('../models/User');
    // 100% DB-driven — .env me koi email set karne ki zaroorat nahi.
    // Rule: jo admin sabse RECENT LOGIN kiya hai wahi real owner hai.
    // Kabhi login na karne wala admin (seed/fresh dummy) sirf tab use hota hai
    // jab koi aur admin hi na ho.
    let admin = await User.findOne({ role: 'admin', lastLoginAt: { $ne: null } })
      .sort({ lastLoginAt: -1 }).lean();
    if (!admin) admin = await User.findOne({ role: 'admin' }).sort({ updatedAt: -1 }).lean();
    const email = (admin && admin.email) || '';
    _adminEmailCache = email;
    _adminEmailAt = now;
    return email;
  } catch (err) {
    return '';
  }
}

function sseBroadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (err) {
      sseClients.delete(res);
    }
  }
}

function addClient(res) {
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
}

/** Create + broadcast a notification for a new enquiry. Never throws. */
async function notifyEnquiry(enquiry) {
  try {
    const reqBits = [
      enquiry.requirementType && `Type: ${enquiry.requirementType}`,
      enquiry.requirementCity && `City: ${enquiry.requirementCity}`,
      enquiry.budget && `Budget: ${enquiry.budget}`,
      enquiry.bedrooms && `BHK: ${enquiry.bedrooms}`,
    ].filter(Boolean).join(' · ');
    const notif = await Notification.create({
      type: 'enquiry',
      title: enquiry.requirementType ? '🎯 New Find-a-Home requirement' : '🔔 New enquiry received',
      message: `${enquiry.name} (${enquiry.phone})${reqBits ? ' — ' + reqBits : ''}${enquiry.propertyTitle ? ' — ' + enquiry.propertyTitle : ''}`,
      enquiryId: enquiry._id,
      propertyTitle: enquiry.propertyTitle || '',
    });
    sseBroadcast('new-enquiry', notif);
    // 📧 Admin ke Gmail pe email jaye — recipient = DB me current admin user ka email
    // (admin panel me email change karo (Settings → Ownership Transfer) → wahi pe jayega, kuch hardcode nahi)
    const adminEmail = await getAdminEmail();
    sendAdminNotificationEmail(enquiry, adminEmail).catch((err) => console.error('[mail] email send failed:', err.message));
    return notif;
  } catch (err) {
    console.error('[notify] failed:', err.message);
    return null;
  }
}

/** Ownership transfer ke baad cache reset — naya email turant pickup ho */
function clearAdminEmailCache() {
  _adminEmailCache = null;
  _adminEmailAt = 0;
}

module.exports = { emitter, addClient, notifyEnquiry, sseBroadcast, clearAdminEmailCache };
