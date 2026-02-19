const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, required: true }, // Format: INV-2026-001
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Venue owner/service provider
  
  // Invoice Details
  invoiceDate: { type: Date, default: Date.now },
  dueDate: Date,
  
  // Booking Details
  eventDetails: {
    eventType: String,
    eventDate: Date,
    eventStartTime: String,
    eventEndTime: String,
    venueName: String,
    guestCount: Number,
    location: String
  },
  
  // Line Items
  lineItems: [{
    description: String, // Venue, Catering, Photography, etc.
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    totalPrice: Number,
    type: { type: String, enum: ['venue', 'service', 'addon', 'discount'] }
  }],
  
  // Cost Breakdown
  subtotal: Number,
  taxRate: { type: Number, default: 0 }, // GST percentage
  taxAmount: Number,
  discountAmount: { type: Number, default: 0 },
  discountReason: String,
  totalAmount: Number,
  
  // Payment Status
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded'],
    default: 'unpaid'
  },
  amountPaid: { type: Number, default: 0 },
  amountDue: Number,
  
  // Customer Information
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // Notes and Terms
  notes: String,
  termsAndConditions: String,
  bankDetails: {
    accountNumber: String,
    accountHolder: String,
    bankName: String,
    ifscCode: String
  },
  
  // Invoice Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  sentAt: Date,
  viewedAt: Date,
  
  // Additional Fields
  currency: { type: String, default: 'INR' },
  invoiceUrl: String, // PDF URL
  invoicePdfPath: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      invoiceDate: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Index for faster queries
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ booking: 1 });
invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
