const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const PaymentMethod = require('../models/PaymentMethod');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_NaH00L6fPmXM6G',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'Dqn1m2Y4nLpY3D5xK7vZ0qA'
});

// ✅ Initiate UPI Payment
router.post('/initiate-upi', authMiddleware, async (req, res) => {
  try {
    const { bookingId, amount, currency, vpa, app } = req.body;
    const userId = req.user.id;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Create Razorpay order for UPI
    const order = await razorpay.orders.create({
      amount: amount,
      currency: currency || 'INR',
      receipt: `order_${bookingId}_${Date.now()}`,
      notes: {
        bookingId: bookingId,
        userId: userId,
        paymentMethod: 'upi',
        upiApp: app
      }
    });

    // Create payment record in DB
    const payment = new Payment({
      booking: bookingId,
      customer: userId,
      amount: amount / 100,
      currency: currency || 'INR',
      paymentMethod: 'upi',
      paymentGateway: 'razorpay',
      razorpayOrderId: order.id,
      upiDetails: {
        vpa: vpa,
        transactionId: null // Will be updated after successful payment
      },
      status: 'initiated',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await payment.save();

    res.json({
      success: true,
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_NaH00L6fPmXM6G',
      paymentId: payment._id,
      message: 'UPI payment initiated'
    });
  } catch (err) {
    console.error('Error initiating UPI payment:', err);
    res.status(500).json({ message: 'Error initiating payment: ' + err.message });
  }
});

// ✅ Initiate Card Payment
router.post('/initiate-card', authMiddleware, async (req, res) => {
  try {
    const { bookingId, amount, currency, card, brand } = req.body;
    const userId = req.user.id;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Create Razorpay order for Card
    const order = await razorpay.orders.create({
      amount: amount,
      currency: currency || 'INR',
      receipt: `order_${bookingId}_${Date.now()}`,
      notes: {
        bookingId: bookingId,
        userId: userId,
        paymentMethod: 'card',
        cardBrand: brand
      }
    });

    // Create payment record in DB
    const payment = new Payment({
      booking: bookingId,
      customer: userId,
      amount: amount / 100,
      currency: currency || 'INR',
      paymentMethod: 'credit_card',
      paymentGateway: 'razorpay',
      razorpayOrderId: order.id,
      cardDetails: {
        last4: card.number.slice(-4),
        brand: brand,
        expiryMonth: card.expiry_month,
        expiryYear: card.expiry_year
      },
      status: 'initiated',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await payment.save();

    res.json({
      success: true,
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_NaH00L6fPmXM6G',
      paymentId: payment._id,
      message: 'Card payment initiated'
    });
  } catch (err) {
    console.error('Error initiating card payment:', err);
    res.status(500).json({ message: 'Error initiating payment: ' + err.message });
  }
});

// ✅ Initiate Net Banking Payment
router.post('/initiate-netbanking', authMiddleware, async (req, res) => {
  try {
    const { bookingId, amount, currency, bank } = req.body;
    const userId = req.user.id;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Create Razorpay order for Net Banking
    const order = await razorpay.orders.create({
      amount: amount,
      currency: currency || 'INR',
      receipt: `order_${bookingId}_${Date.now()}`,
      notes: {
        bookingId: bookingId,
        userId: userId,
        paymentMethod: 'net_banking',
        bank: bank
      }
    });

    // Create payment record in DB
    const payment = new Payment({
      booking: bookingId,
      customer: userId,
      amount: amount / 100,
      currency: currency || 'INR',
      paymentMethod: 'net_banking',
      paymentGateway: 'razorpay',
      razorpayOrderId: order.id,
      netBankingDetails: {
        bankName: bank,
        bankTransactionId: null
      },
      status: 'initiated',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await payment.save();

    res.json({
      success: true,
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_NaH00L6fPmXM6G',
      paymentId: payment._id,
      message: 'Net Banking payment initiated'
    });
  } catch (err) {
    console.error('Error initiating net banking payment:', err);
    res.status(500).json({ message: 'Error initiating payment: ' + err.message });
  }
});

// ✅ Verify Payment
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const {
      bookingId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      paymentMethod,
      cardLast4,
      cardBrand,
      bankName,
      upiVpa
    } = req.body;

    // Verify Razorpay signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'Dqn1m2Y4nLpY3D5xK7vZ0qA');
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Fetch payment from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayPaymentId: razorpayPaymentId },
      {
        status: 'completed',
        completedAt: new Date(),
        razorpayPaymentId: razorpayPaymentId,
        razorpaySignature: razorpaySignature
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Update booking status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: 'completed',
        status: 'confirmed',
        razorpayPaymentId: razorpayPaymentId
      },
      { new: true }
    );

    // Create invoice
    const lineItems = [];
    if (booking.venue) {
      const venue = await booking.populate('venue');
      lineItems.push({
        description: `Venue: ${venue.venue.name}`,
        quantity: 1,
        unitPrice: venue.venue.pricePerDay,
        totalPrice: venue.venue.pricePerDay,
        type: 'venue'
      });
    }

    // Add services to line items
    if (booking.services && booking.services.length > 0) {
      const services = await booking.populate('services');
      services.services.forEach(service => {
        lineItems.push({
          description: `Service: ${service.name}`,
          quantity: 1,
          unitPrice: service.pricing.fullEvent || service.pricing.hourly,
          totalPrice: service.pricing.fullEvent || service.pricing.hourly,
          type: 'service'
        });
      });
    }

    const invoice = new Invoice({
      booking: bookingId,
      payment: payment._id,
      customer: booking.customer,
      invoiceDate: new Date(),
      eventDetails: {
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        eventStartTime: booking.eventStartTime,
        eventEndTime: booking.eventEndTime,
        venueName: booking.venue?.name,
        guestCount: booking.guestCount,
        location: booking.venue?.location
      },
      lineItems: lineItems,
      subtotal: booking.totalCost,
      taxRate: 18,
      taxAmount: Math.round(booking.totalCost * 0.18),
      totalAmount: Math.round(booking.totalCost * 1.18),
      paymentStatus: 'paid',
      amountPaid: payment.amount,
      customerInfo: {
        name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone
      },
      status: 'sent'
    });

    await invoice.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: payment,
      invoice: invoice,
      redirectUrl: `/payment-success?paymentId=${razorpayPaymentId}&bookingId=${bookingId}`
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment: ' + err.message
    });
  }
});

// ✅ Get Payment Details
router.get('/:paymentId', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (err) {
    console.error('Error fetching payment:', err);
    res.status(500).json({ message: 'Error fetching payment: ' + err.message });
  }
});

// ✅ Get Payment Methods for User
router.get('/methods/list', authMiddleware, async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ user: req.user.id, isActive: true });
    res.json(methods);
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    res.status(500).json({ message: 'Error fetching payment methods: ' + err.message });
  }
});

// ✅ Save Payment Method
router.post('/methods/save', authMiddleware, async (req, res) => {
  try {
    const { type, cardDetails, upiDetails, netBankingDetails, nickname } = req.body;

    const method = new PaymentMethod({
      user: req.user.id,
      type: type,
      card: cardDetails,
      upi: upiDetails,
      netBanking: netBankingDetails,
      nickname: nickname,
      isActive: true
    });

    await method.save();

    res.json({
      success: true,
      message: 'Payment method saved',
      method: method
    });
  } catch (err) {
    console.error('Error saving payment method:', err);
    res.status(500).json({ message: 'Error saving payment method: ' + err.message });
  }
});

// ✅ Delete Payment Method
router.delete('/methods/:methodId', authMiddleware, async (req, res) => {
  try {
    const method = await PaymentMethod.findByIdAndUpdate(
      req.params.methodId,
      { isActive: false },
      { new: true }
    );

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    res.json({
      success: true,
      message: 'Payment method deleted'
    });
  } catch (err) {
    console.error('Error deleting payment method:', err);
    res.status(500).json({ message: 'Error deleting payment method: ' + err.message });
  }
});

module.exports = router;
