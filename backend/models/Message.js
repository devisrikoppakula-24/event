const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation participants
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: String,
  senderRole: { type: String, enum: ['customer', 'service_provider', 'venue_owner', 'admin'] },
  
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientName: String,
  recipientRole: { type: String, enum: ['customer', 'service_provider', 'venue_owner', 'admin'] },
  
  // Conversation context
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  
  // Message content
  messageText: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'document'], default: 'text' },
  attachmentUrl: String,
  
  // Status tracking
  isRead: { type: Boolean, default: false },
  readAt: Date,
  isArchived: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  
  // Reactions
  reactions: [{
    emoji: String,
    userId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: Date
});

// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ IsRead: 1, recipientId: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
