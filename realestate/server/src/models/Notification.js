const mongoose = require('mongoose');

/**
 * In-app notifications for the admin panel.
 * Created automatically when a visitor submits an enquiry.
 * (type 'enquiry') — could be extended for system alerts.
 */
const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['enquiry', 'system'], default: 'enquiry' },
    title: { type: String, default: 'New enquiry received' },
    message: { type: String, default: '' },
    enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', default: null },
    propertyTitle: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
