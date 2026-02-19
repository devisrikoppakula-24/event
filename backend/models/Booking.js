const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  eventDate: { type: Date, required: true },
  eventStartTime: { type: String, required: true }, // HH:MM format
  eventEndTime: { type: String, required: true }, // HH:MM format
  eventType: { type: String, enum: ['marriage', 'birthday', 'engagement', 'corporate', 'other'], required: true },
  guestCount: { type: Number, required: true },
  totalCost: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  stripePaymentId: String,
  razorpayPaymentId: String,
  razorpayOrderId: String,
  paymentRequests: [{
    _id: mongoose.Schema.Types.ObjectId,
    amount: Number,
    description: String,
    status: { type: String, enum: ['pending', 'paid', 'expired'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  specialRequests: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
