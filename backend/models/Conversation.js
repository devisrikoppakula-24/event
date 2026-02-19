const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Participants
  participant1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participant1Unread: { type: Number, default: 0 },
  
  participant2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participant2Unread: { type: Number, default: 0 },
  
  // Context
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  conversationType: { type: String, enum: ['service_inquiry', 'venue_inquiry', 'booking_support', 'general'], default: 'general' },
  
  // Metadata
  subject: String,
  lastMessage: String,
  lastMessageTime: Date,
  
  // Status
  isActive: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  
  // Statistics
  messageCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries
conversationSchema.index({ participant1: 1, participant2: 1 });
conversationSchema.index({ participant1: 1, updatedAt: -1 });
conversationSchema.index({ participant2: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
