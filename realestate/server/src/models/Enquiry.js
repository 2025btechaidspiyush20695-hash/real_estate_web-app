const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    message: { type: String, default: '' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },
    propertyTitle: { type: String, default: '' },
    status: { type: String, enum: ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed'], default: 'new' },
    lastContactedAt: { type: Date, default: null },
    nextFollowUp: { type: Date, default: null },
    source: { type: String, default: 'Website' },
    budgetPref: { type: String, default: '' },
    preferredBhk: { type: String, default: '' },
    notes: { type: String, default: '' },
    // ---- Find-a-Home requirement fields (optional) ----
    requirementType: { type: String, default: '' },
    requirementCity: { type: String, default: '' },
    budget: { type: String, default: '' },
    bedrooms: { type: String, default: '' },
    timeline: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enquiry', enquirySchema);
