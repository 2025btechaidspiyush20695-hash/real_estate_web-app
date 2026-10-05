const mongoose = require('mongoose');

const siteVisitSchema = new mongoose.Schema(
  {
    leadName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },
    propertyTitle: { type: String, default: '' },
    date: { type: Date, required: true },
    time: { type: String, default: '11:00 AM' },
    status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
    // feedback (after visit)
    interested: { type: String, enum: ['', 'yes', 'no', 'maybe'], default: '' },
    budgetSuitable: { type: String, enum: ['', 'yes', 'no'], default: '' },
    followUpDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', default: null },
  },
  { timestamps: true }
);
siteVisitSchema.index({ date: 1, status: 1 });
module.exports = mongoose.model('SiteVisit', siteVisitSchema);
