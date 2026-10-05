const mongoose = require('mongoose');

/**
 * App settings key-value store.
 * SMTP credentials yahan safe rehte hain — yeh collection SIRF admin API
 * (/api/settings) se accessible hai, public /api/site se NEVER expose hota.
 */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
