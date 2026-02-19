const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registrationNumber: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  city: String,
  state: String,
  pincode: String,
  latitude: Number,
  longitude: Number,
  images: [String],
  videos: [String],
  description: String,
  capacity: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  facilities: [String],
  cateringOptions: [String],
  availableDates: [Date],
  bookedDates: [Date],
  recentEvents: [{
    title: String,
    date: Date,
    images: [String],
    eventType: String
  }],
  ratings: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    text: String,
    rating: { type: Number, min: 1, max: 5 },
    date: { type: Date, default: Date.now }
  }],
  contactNumber: String,
  ownerDetails: {
    name: String,
    email: String,
    mobile: String
  },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Venue', venueSchema);
