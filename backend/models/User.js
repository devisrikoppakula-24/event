const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'venue_owner', 'service_provider', 'admin'], default: 'customer' },
  location: { type: String },
  profileImage: String,
  bio: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  isApproved: { type: Boolean, default: function() { return this.role === 'customer' || this.role === 'admin'; } },
  isVerified: { type: Boolean, default: false },
  verificationDocuments: [String],
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
