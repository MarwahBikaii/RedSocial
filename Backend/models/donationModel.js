const mongoose = require('mongoose');

const donationRequestSchema = new mongoose.Schema({
  requesterName: {
    type: String,
    required: true
  },
  bloodType: {
    type: String,
    required: true
  },
  units: {   // New field for blood units
    type: Number,
    required: true,   // Making it a required field
  },
  emergency: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DonationRequest = mongoose.model('DonationRequest', donationRequestSchema);

module.exports = DonationRequest;
