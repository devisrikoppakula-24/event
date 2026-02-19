const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Payment Method Type
  type: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'],
    required: true
  },
  
  // Card Details (for cards)
  card: {
    cardholderName: String,
    cardNumber: String, // Encrypted - store only last 4 digits
    last4: String,
    first6: String,
    expiryMonth: Number,
    expiryYear: Number,
    cvv: String, // Encrypted
    brand: String, // 'visa', 'mastercard', 'amex'
    issuerBank: String,
    issuerName: String
  },
  
  // UPI Details
  upi: {
    vpa: String, // e.g., user@upi
    providerApp: String, // 'google_pay', 'phonepe', 'paytm'
    isVerified: { type: Boolean, default: false }
  },
  
  // Net Banking Details
  netBanking: {
    bankName: String,
    bankCode: String,
    accountNumber: String, // Encrypted - store only last 4
    last4Account: String,
    accountType: String, // 'savings', 'current'
    isVerified: { type: Boolean, default: false }
  },
  
  // Wallet Details
  wallet: {
    walletProvider: String, // 'paytm', 'mobikwik', 'amazon_pay'
    walletId: String,
    balance: { type: Number, default: 0 }
  },
  
  // Gateway Token (for tokenization)
  gatewayToken: String, // Razorpay token ID, Stripe token, etc.
  gateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'phonepe', 'googlepay'],
    default: 'razorpay'
  },
  
  // Payment Method Status
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  // Security and Verification
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  otp: String, // For OTP verification
  otpExpiresAt: Date,
  
  // Usage Statistics
  totalTransactions: { type: Number, default: 0 },
  totalAmountUsed: { type: Number, default: 0 },
  lastUsedDate: Date,
  
  // Nicknames for user reference
  nickname: String, // e.g., 'My Visa', 'Work Debit Card'
  
  // Billing Address
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: Date // For temporary payment methods
});

// Indexes
paymentMethodSchema.index({ user: 1, isActive: 1 });
paymentMethodSchema.index({ user: 1, isDefault: 1 });
paymentMethodSchema.index({ gatewayToken: 1 }, { sparse: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
