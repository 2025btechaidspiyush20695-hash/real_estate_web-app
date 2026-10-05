const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    type: { type: String, default: 'House' }, // House, Bungalow, Flat, Villa, Haveli, Duplex, Townhouse
    status: { type: String, enum: ['sale', 'rent'], default: 'sale' },
    listingStatus: { type: String, enum: ['draft', 'published', 'under_offer', 'sold', 'rented', 'archived'], default: 'published' },
    city: { type: String, default: 'Jaipur' },
    locality: { type: String, default: '' },
    address: { type: String, default: '' },
    area: { type: Number, min: 0 }, // sq.ft.
    plotArea: { type: Number, min: 0 }, // sq. yd.
    bedrooms: { type: Number, min: 0, default: 2 },
    bathrooms: { type: Number, min: 0, default: 2 },
    floors: { type: Number, min: 1, default: 1 },
    parking: { type: Number, min: 0, default: 1 },
    yearBuilt: { type: Number },
    possession: { type: String, default: 'Ready to move' },
    furnishing: { type: String, enum: ['Unfurnished', 'Semi-furnished', 'Fully furnished'], default: 'Semi-furnished' },
    amenities: [{ type: String }],
    images: [{ type: String }], // urls like /uploads/seed/prop-1.jpg
    availability: { type: String, enum: ['available', 'limited', 'sold'], default: 'available' },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

propertySchema.index({ city: 1, status: 1, type: 1 });
propertySchema.index({ price: 1 });

propertySchema.methods.toSafeJSON = function () {
  return this.toObject();
};

module.exports = mongoose.model('Property', propertySchema);
