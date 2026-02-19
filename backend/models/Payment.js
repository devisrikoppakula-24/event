const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'],
    required: true
  },
  paymentGateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'phonepe', 'googlepay'],
    default: 'razorpay'
  },
  // Razorpay specific fields
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  // Stripe specific fields
  stripePaymentIntentId: String,
  stripePaymentMethodId: String,
  // Additional payment details
  cardDetails: {
    last4: String,
    brand: String, // 'visa', 'mastercard', 'amex'
    expiryMonth: Number,
    expiryYear: Number
  },
  upiDetails: {
    vpa: String, // Virtual Payment Address
    transactionId: String
  },
  netBankingDetails: {
    bankName: String,
    accountNumber: String,
    bankTransactionId: String
  },
  status: {
    type: String,
    enum: ['initiated', 'pending', 'completed', 'failed', 'refunded'],
    default: 'initiated'
  },
  failureReason: String,
  refundAmount: { type: Number, default: 0 },
  refundDate: Date,
  refundReason: String,
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date
});

// Index for faster queries
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ razorpayPaymentId: 1 }, { sparse: true });
paymentSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
