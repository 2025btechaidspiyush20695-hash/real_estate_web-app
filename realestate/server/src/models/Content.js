const mongoose = require('mongoose');

/**
 * Generic content store. Each document is one editable "block" of the website:
 * { key: 'hero', label: 'Hero Section', data: { ...any json... } }
 */
const contentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Content', contentSchema);
