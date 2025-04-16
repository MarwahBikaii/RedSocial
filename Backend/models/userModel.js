const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordConfirm: { type: String, required: function() { return this.isNew; }  },// Required only for new users },
  role: { 
    type: [String],  // Allow multiple roles
    enum: ['user', 'hospital', 'admin'], // Merged 'donor' and 'requestor' into 'user'
    required: true 
  },
  bloodType: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: function() { return this.role.includes('user'); },
    message: 'Blood type is required for users.'
  },
  phone: { 
    type: String, 
    required: function() { return this.role.includes('user') || this.role.includes('hospital'); },
    message: 'Phone number is required for users and hospitals.'
  },

   location: {
    type: { type: String, default: "Point" },

    coordinates: { type: [Number], index: "2dsphere" } // ✅ Ensure GeoJSON
  },
  availability: { type: Boolean, default: true },
  profilePicture: { type: String, default: '' },
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // New Fields
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  },
  bloodRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest'
  }],
  donationHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation'
  }],
  isVerified: { type: Boolean, default: false }  // New verification flag
}, { timestamps: true });


// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  console.log('Role:', this.role);  // Add this line to debug
  if (!this.isModified('password')) return next();  // Only hash if password is modified
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // Don't store passwordConfirm in DB
  next();
});

// Instance method to check password
UserSchema.methods.checkPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to check if the password was changed after the token was issued
UserSchema.methods.passwordChangedAfterTokenIssued = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimeStamp < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model('User', UserSchema);
