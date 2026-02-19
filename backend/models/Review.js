const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Link to service or venue
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  
  // User who left the review
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: String,
  
  // Review content
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  comment: String,
  
  // Helpful features (for services)
  serviceQuality: { type: Number, min: 1, max: 5 },
  timeliness: { type: Number, min: 1, max: 5 },
  valueForMoney: { type: Number, min: 1, max: 5 },
  
  // Helpful features (for venues)
  ambiance: { type: Number, min: 1, max: 5 },
  cleanliness: { type: Number, min: 1, max: 5 },
  facilities: { type: Number, min: 1, max: 5 },
  staff: { type: Number, min: 1, max: 5 },
  
  // Images from event
  images: [String],
  
  // Verification
  isVerified: { type: Boolean, default: false },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  
  // Engagement
  helpfulCount: { type: Number, default: 0 },
  unhelpfulCount: { type: Number, default: 0 },
  
  // Moderation
  isApproved: { type: Boolean, default: true },
  flaggedAsInappropriate: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries
reviewSchema.index({ serviceId: 1, rating: 1 });
reviewSchema.index({ venueId: 1, rating: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
