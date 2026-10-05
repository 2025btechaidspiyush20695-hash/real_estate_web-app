/**
 * ============================================================
 *  Gurukripa Estate — Safe Database Cleanup
 * ------------------------------------------------------------
 *  SIRF KACHRA DELETE KARTA HAI — important data KABHI NAHI:
 *
 *  ❌ KABHI DELETE NAHI:
 *     - properties (ghar listings)
 *     - contents   (website text/images)
 *     - users      (admin account)
 *     - enquiries  (business leads — default; sirf --purge-old-leads
 *                   flag se 180 din+ purani 'contacted' leads jaati hain)
 *     - unread notifications
 *
 *  ✅ DELETE HOTA HAI (sirf bekaar cheezein):
 *     - notifications jo READ hain aur 30 din+ purani hain
 *     - audit logs 90 din+ purane
 *     - expired OTP / reset tokens (jo waise bhi TTL se expire hain)
 *
 *  USE:
 *     node scripts/cleanup-db.js            → pehle DRY-RUN (sirf dikhata hai)
 *     node scripts/cleanup-db.js --yes      → asli cleanup
 *     node scripts/cleanup-db.js --purge-old-leads --yes
 *                                           → + 180 din purani contacted leads bhi
 * ============================================================
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'server', '.env') });
const mongoose = require('mongoose');
// server/node_modules se require (root me dotenv nahi hai)
const Module = require('module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === 'mongoose') {
    return origResolve.call(this, request, { paths: [require('path').join(__dirname, '..', 'server', 'node_modules')], ...args[1] }, ...args.slice(1));
  }
  return origResolve.call(this, request, ...args);
};

const args = process.argv.slice(2);
const CONFIRM = args.includes('--yes');
const PURGE_LEADS = args.includes('--purge-old-leads');

const READ_NOTIF_DAYS = 30;
const AUDIT_DAYS = 90;
const OLD_LEAD_DAYS = 180;

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 25000 });
  console.log('[cleanup] connected to:', mongoose.connection.host.split('.')[0] + '...');

  const now = Date.now();
  const out = [];

  // ---- 1. Read notifications older than 30 days ----
  const notifCut = new Date(now - READ_NOTIF_DAYS * 24 * 3600 * 1000);
  const oldNotifs = await mongoose.connection.db.collection('notifications').countDocuments({
    read: true, createdAt: { $lt: notifCut },
  });
  out.push(`• ${oldNotifs} purani READ notifications (${READ_NOTIF_DAYS} din+ purani)`);

  // ---- 2. Audit logs older than 90 days ----
  const auditCut = new Date(now - AUDIT_DAYS * 24 * 3600 * 1000);
  const oldAudits = await mongoose.connection.db.collection('auditlogs').countDocuments({
    createdAt: { $lt: auditCut },
  });
  out.push(`• ${oldAudits} purane audit logs (${AUDIT_DAYS} din+ purane)`);

  // ---- 3. Expired OTPs / reset tokens (TTL backup sweep) ----
  const expiredOtps = await mongoose.connection.db.collection('otpcodes').countDocuments({
    expiresAt: { $lt: new Date() },
  });
  const expiredResets = await mongoose.connection.db.collection('passwordresets').countDocuments({
    expiresAt: { $lt: new Date() },
  });
  out.push(`• ${expiredOtps} expired OTP + ${expiredResets} expired reset tokens`);

  // ---- 4. (Optional) old contacted leads ----
  let oldLeads = 0;
  if (PURGE_LEADS) {
    const leadCut = new Date(now - OLD_LEAD_DAYS * 24 * 3600 * 1000);
    oldLeads = await mongoose.connection.db.collection('enquiries').countDocuments({
      status: 'contacted', createdAt: { $lt: leadCut },
    });
    out.push(`• ${oldLeads} purani 'contacted' enquiries (${OLD_LEAD_DAYS} din+ — sirf flag ke saath)`);
  } else {
    out.push('• enquiries: SKIP (flag --purge-old-leads nahi diya)');
  }

  console.log('\n=== KYA DELETE HOGA ===');
  out.forEach((l) => console.log(l));

  const total = oldNotifs + oldAudits + expiredOtps + expiredResets + oldLeads;

  if (!CONFIRM) {
    console.log('\n⚠️  DRY-RUN — kuch delete NAHI hua. Asli cleanup ke liye:');
    console.log('    node scripts/cleanup-db.js --yes');
    console.log('   (--purge-old-leads bhi chahiye to: node scripts/cleanup-db.js --purge-old-leads --yes)');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ---- ASLI DELETE ----
  await mongoose.connection.db.collection('notifications').deleteMany({ read: true, createdAt: { $lt: notifCut } });
  await mongoose.connection.db.collection('auditlogs').deleteMany({ createdAt: { $lt: auditCut } });
  await mongoose.connection.db.collection('otpcodes').deleteMany({ expiresAt: { $lt: new Date() } });
  await mongoose.connection.db.collection('passwordresets').deleteMany({ expiresAt: { $lt: new Date() } });
  if (PURGE_LEADS) {
    await mongoose.connection.db.collection('enquiries').deleteMany({
      status: 'contacted', createdAt: { $lt: new Date(now - OLD_LEAD_DAYS * 24 * 3600 * 1000) },
    });
  }

  // ---- SAFETY CHECK: important data abhi bhi hai? ----
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
  console.log(`\n[cleanup] DONE — ${total} records cleaned. Important data SAFE.`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error('[cleanup] failed:', e.message); process.exit(1); });
