const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodType: { type: String, required: true },
  location: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v) {
          return v.length === 2 &&
            !isNaN(v[0]) && !isNaN(v[1]) &&
            v[0] >= -180 && v[0] <= 180 &&
            v[1] >= -90 && v[1] <= 90;
        },
        message: props => `Invalid coordinates: ${props.value}`
      }
    }
  },
  urgencyLevel: { type: String, enum: ['high', 'medium', 'low'], required: true },
  status: { type: String, enum: ['pending', 'matched', 'fulfilled'], default: 'pending' },

  bloodUnits: { type: Number, required: true }, // Total units requested
  fulfilledUnits: { type: Number, default: 0 }, // ✅ Track units fulfilled
  isFulfilled: { type: Boolean, default: false }, // ✅ Boolean flag

  matchedDonors: [{
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    unitsDonated: { type: Number, min: 0.5, max: 1 }, // Units donated by this donor
    donationDate: { type: Date, default: Date.now }
  }],

  expirationDate: { type: Date, required: true },
  additionalNotes: { type: String },
  contactInfo: {
    phone: { type: String },
    email: { type: String }
  },
  urgencyDescription: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'] },
  statusUpdateHistory: [{
    status: { type: String, enum: ['pending', 'matched', 'fulfilled'] },
    updatedAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }],
  hospital: {
    name: { type: String },
    contactNumber: { type: String },
    address: { type: String }
  }
}, { timestamps: true });

BloodRequestSchema.index({ location: "2dsphere" });

BloodRequestSchema.pre("save", function (next) {
  if (!this.isNew) {
    console.log("🔍 Pre-save hook running, status:", this.status);
  }
  next();
});

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
