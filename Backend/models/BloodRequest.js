const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodType: { type: String, required: true },
location: {
    type: { type: String, default: "Point" },  // ✅ GeoJSON format
    coordinates: { type: [Number], index: "2dsphere", required: true }  // ✅ [lng, lat]
  }
,
 urgencyLevel: { type: String, enum: ['high', 'medium', 'low'], required: true },  // ✅ Make sure backend handles it as a string  status: { type: String, enum: ['pending', 'matched', 'fulfilled'], default: 'pending' },
  matchedDonor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expirationDate: { type: Date, required: true },
  additionalNotes: { type: String },
  contactInfo: {
    phone: { type: String },
    email: { type: String }
  },
  bloodUnits: { type: Number, required: true },
  urgencyDescription: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'] },
  statusUpdateHistory: [{
    status: { type: String, enum: ['pending', 'matched', 'fulfilled'], default: 'pending' },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  tags: [{ type: String }],
  hospital: {
    name: { type: String },
    contactNumber: { type: String },
    address: { type: String }
  }
}, { timestamps: true });

BloodRequestSchema.index({ "location.coordinates": "2dsphere" }); 


module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
