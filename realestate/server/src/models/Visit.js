const mongoose = require('mongoose');

/**
 * Daily website visit tracking.
 * One visit per device per day: unique index on (deviceId, date).
 * date = YYYY-MM-DD in Asia/Kolkata timezone (business owner's local day).
 */
const visitSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, trim: true, maxlength: 80 },
  date: { type: String, required: true }, // YYYY-MM-DD (IST)
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '', maxlength: 300 },
  path: { type: String, default: '/', maxlength: 150 },
  createdAt: { type: Date, default: Date.now },
});

visitSchema.index({ deviceId: 1, date: 1 }, { unique: true });
visitSchema.index({ date: 1 });

module.exports = mongoose.model('Visit', visitSchema);
