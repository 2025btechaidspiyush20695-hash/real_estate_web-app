/**
 * Safe DB cleanup (server context me chalta hai — dotenv + mongoose yahan hain)
 * Usage:
 *   node src/cleanup.js            → DRY-RUN (sirf dikhata hai)
 *   node src/cleanup.js --yes      → asli cleanup
 *   node src/cleanup.js --purge-old-leads --yes
 */
require('dotenv').config();
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const CONFIRM = args.includes('--yes');
const PURGE_LEADS = args.includes('--purge-old-leads');
const READ_NOTIF_DAYS = 30;
const AUDIT_DAYS = 90;
const OLD_LEAD_DAYS = 180;

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 25000 });
  console.log('[cleanup] connected ->', String(mongoose.connection.host).split('.')[0] + '…');

  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const notifCut = new Date(now - READ_NOTIF_DAYS * day);
  const auditCut = new Date(now - AUDIT_DAYS * day);

  const oldNotifs = await mongoose.connection.db.collection('notifications').countDocuments({ read: true, createdAt: { $lt: notifCut } });
  const oldAudits = await mongoose.connection.db.collection('auditlogs').countDocuments({ createdAt: { $lt: auditCut } });
  const expiredOtps = await mongoose.connection.db.collection('otpcodes').countDocuments({ expiresAt: { $lt: new Date() } });
  const expiredResets = await mongoose.connection.db.collection('passwordresets').countDocuments({ expiresAt: { $lt: new Date() } });
  let oldLeads = 0;
  if (PURGE_LEADS) {
    oldLeads = await mongoose.connection.db.collection('enquiries').countDocuments({ status: 'contacted', createdAt: { $lt: new Date(now - OLD_LEAD_DAYS * day) } });
  }

  console.log('\n=== KYA DELETE HOGA ===');
  console.log(`• ${oldNotifs} purani READ notifications (${READ_NOTIF_DAYS} din+)`);
  console.log(`• ${oldAudits} purane audit logs (${AUDIT_DAYS} din+)`);
  console.log(`• ${expiredOtps} expired OTP + ${expiredResets} expired reset tokens`);
  console.log(PURGE_LEADS ? `• ${oldLeads} purani contacted enquiries (${OLD_LEAD_DAYS} din+)` : '• enquiries: SKIP (--purge-old-leads flag nahi)');

  if (!CONFIRM) {
    console.log('\n⚠️ DRY-RUN — kuch delete NAHI hua.');
    console.log('Asli cleanup: node src/cleanup.js --yes');
    await mongoose.disconnect();
    process.exit(0);
  }

  await mongoose.connection.db.collection('notifications').deleteMany({ read: true, createdAt: { $lt: notifCut } });
  await mongoose.connection.db.collection('auditlogs').deleteMany({ createdAt: { $lt: auditCut } });
  await mongoose.connection.db.collection('otpcodes').deleteMany({ expiresAt: { $lt: new Date() } });
  await mongoose.connection.db.collection('passwordresets').deleteMany({ expiresAt: { $lt: new Date() } });
  if (PURGE_LEADS) {
    await mongoose.connection.db.collection('enquiries').deleteMany({ status: 'contacted', createdAt: { $lt: new Date(now - OLD_LEAD_DAYS * day) } });
  }

  const [props, contents, users, leads, unread] = await Promise.all([
    mongoose.connection.db.collection('properties').countDocuments(),
    mongoose.connection.db.collection('contents').countDocuments(),
    mongoose.connection.db.collection('users').countDocuments(),
    mongoose.connection.db.collection('enquiries').countDocuments(),
    mongoose.connection.db.collection('notifications').countDocuments({ read: false }),
  ]);
  console.log('\n=== SAFETY CHECK (delete ke BAAD) ===');
  console.log(`✅ properties: ${props} | contents: ${contents} | users: ${users}`);
  console.log(`✅ enquiries: ${leads} | unread notifications: ${unread}`);
  console.log('\n[cleanup] DONE — important data SAFE ✅');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error('[cleanup] failed:', e.message); process.exit(1); });
