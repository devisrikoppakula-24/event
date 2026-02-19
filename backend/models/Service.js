const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registrationNumber: { type: String, unique: true, required: true },
  type: { type: String, enum: ['catering', 'photographer', 'decoration', 'makeup', 'cultural', 'event_manager', 'priest'], required: true },
  name: { type: String, required: true },
  description: String,
  images: [String],
  videos: [String],
  portfolio: [{
    title: String,
    description: String,
    images: [String],
    date: Date,
    eventType: String
  }],
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  pricing: { 
    hourly: Number, 
    fullEvent: Number,
    perPerson: Number,
    packages: [{
      name: String,
      description: String,
      price: Number,
      features: [String]
    }]
  },
  serviceLocations: [String],
  availableDates: [Date],
  bookedDates: [Date],
  workingHours: {
    startTime: String,
    endTime: String
  },
  cateringMenu: {
    vegDishes: [{
      name: String,
      description: String,
      price: Number
    }],
    nonVegDishes: [{
      name: String,
      description: String,
      price: Number
    }]
  },
  ratings: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  reviews: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    text: String, 
    rating: Number,
    date: { type: Date, default: Date.now }
  }],
  contactNumber: String,
  providerDetails: {
    name: String,
    email: String,
    mobile: String,
    experience: String
  },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
