const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'test');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_NaH00L6fPmXM6G',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'Dqn1m2Y4nLpY3D5xK7vZ0qA'
});

// ✅ Check venue availability for specific date and time
router.post('/check-availability', async (req, res) => {
  try {
    const { venueId, eventDate, eventStartTime, eventEndTime } = req.body;

    if (!venueId || !eventDate || !eventStartTime || !eventEndTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Convert date string to Date object
    const checkDate = new Date(eventDate);
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find conflicting bookings
    const conflicts = await Booking.find({
      venue: venueId,
      eventDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'pending'] }
    });

    // Check if time slots conflict
    let isAvailable = true;
    const [reqStartHour, reqStartMin] = eventStartTime.split(':').map(Number);
    const [reqEndHour, reqEndMin] = eventEndTime.split(':').map(Number);
    const reqStartMinutes = reqStartHour * 60 + reqStartMin;
    const reqEndMinutes = reqEndHour * 60 + reqEndMin;

    for (const booking of conflicts) {
      const [bookStartHour, bookStartMin] = booking.eventStartTime.split(':').map(Number);
      const [bookEndHour, bookEndMin] = booking.eventEndTime.split(':').map(Number);
      const bookStartMinutes = bookStartHour * 60 + bookStartMin;
      const bookEndMinutes = bookEndHour * 60 + bookEndMin;

      // Check overlap: if one starts before the other ends
      if (reqStartMinutes < bookEndMinutes && reqEndMinutes > bookStartMinutes) {
        isAvailable = false;
        break;
      }
    }

    res.json({
      available: isAvailable,
      venue: {
        id: venue._id,
        name: venue.name,
        capacity: venue.capacity,
        pricePerDay: venue.pricePerDay
      },
      conflictingBookings: conflicts.length
    });
  } catch (err) {
    console.error('Error checking availability:', err);
    res.status(500).json({ message: 'Error checking availability: ' + err.message });
  }
});

// 📅 Create booking (Protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      venueId,
      eventDate,
      eventStartTime,
      eventEndTime,
      eventType,
      guestCount,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
      services
    } = req.body;

    // Validation
    if (!venueId || !eventDate || !eventStartTime || !eventEndTime || !eventType || !guestCount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check availability again before booking
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    if (guestCount > venue.capacity) {
      return res.status(400).json({ message: `Venue capacity is ${venue.capacity}, but ${guestCount} guests requested` });
    }

    // Check conflicts
    const checkDate = new Date(eventDate);
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflicts = await Booking.find({
      venue: venueId,
      eventDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'pending'] }
    });

    const [reqStartHour, reqStartMin] = eventStartTime.split(':').map(Number);
    const [reqEndHour, reqEndMin] = eventEndTime.split(':').map(Number);
    const reqStartMinutes = reqStartHour * 60 + reqStartMin;
    const reqEndMinutes = reqEndHour * 60 + reqEndMin;

    for (const booking of conflicts) {
      const [bookStartHour, bookStartMin] = booking.eventStartTime.split(':').map(Number);
      const [bookEndHour, bookEndMin] = booking.eventEndTime.split(':').map(Number);
      const bookStartMinutes = bookStartHour * 60 + bookStartMin;
      const bookEndMinutes = bookEndHour * 60 + bookEndMin;

      if (reqStartMinutes < bookEndMinutes && reqEndMinutes > bookStartMinutes) {
        return res.status(400).json({ message: 'Time slot not available' });
      }
    }

    // Calculate total cost (venue price + services)
    let totalCost = venue.pricePerDay;
    if (services && services.length > 0) {
      const Service = require('../models/Service');
      const serviceList = await Service.find({ _id: { $in: services } });
      serviceList.forEach(service => {
        if (service.pricing.fullEvent) {
          totalCost += service.pricing.fullEvent;
        }
      });
    }

    // Create booking
    const booking = new Booking({
      customer: req.userId,
      venue: venueId,
      eventDate: new Date(eventDate),
      eventStartTime,
      eventEndTime,
      eventType,
      guestCount,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
      services: services || [],
      totalCost,
      status: 'pending'
    });

    await booking.save();
    await booking.populate('venue', 'name location pricePerDay');
    await booking.populate('services', 'name type pricing');

    console.log(`✅ Booking created: ${customerName} for venue ${venue.name}`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      booking
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: 'Error creating booking: ' + err.message });
  }
});

// 📋 Get all bookings for authenticated user
router.get('/user/bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.userId })
      .populate('venue', 'name location images pricePerDay')
      .populate('services', 'name type pricing')
      .sort({ eventDate: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ message: 'Error fetching bookings: ' + err.message });
  }
});

// 📝 Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email mobile')
      .populate('venue', 'name location pricePerDay images')
      .populate('services', 'name type pricing');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ message: 'Error fetching booking: ' + err.message });
  }
});

// ✏️ Update booking status (Protected - Venue Owner or Admin)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    booking.updatedAt = Date.now();
    await booking.save();

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking
    });
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ message: 'Error updating booking: ' + err.message });
  }
});

// 🗑️ Cancel booking
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only booking customer can cancel' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ message: 'Error cancelling booking: ' + err.message });
  }
});

// Process payment (keep existing)
router.post('/payment', async (req, res) => {
  try {
    const { bookingId, amount, token } = req.body;
    
    const charge = await stripe.charges.create({
      amount: amount * 100,
      currency: 'usd',
      source: token
    });
    
    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: 'completed',
      stripePaymentId: charge.id,
      status: 'confirmed'
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Initiate Razorpay Payment
router.post('/initiate-payment', authMiddleware, async (req, res) => {
  try {
    const { bookingId, amount, currency } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ message: 'Missing required fields: bookingId and amount required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Verify booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount), // Amount in paise
      currency: currency || 'INR',
      receipt: `booking_${bookingId}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_NaH00L6fPmXM6G',
      bookingId: bookingId,
      amount: amount
    });
  } catch (err) {
    console.error('Error initiating payment - Details:', err.message, err.response?.data || err);
    res.status(500).json({ message: 'Error initiating payment: ' + (err.response?.data?.error?.description || err.message || 'Unknown error') });
  }
});

// ✅ Verify Razorpay Payment
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'Dqn1m2Y4nLpY3D5xK7vZ0qA');
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const digest = hmac.digest('hex');

    if (digest !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Update booking with payment details
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: 'completed',
        razorpayPaymentId: razorpayPaymentId,
        razorpayOrderId: razorpayOrderId,
        status: 'confirmed'
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get all bookings for a venue owner's venues
router.get('/owner/venue-bookings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all venues owned by this user
    const venues = await Venue.find({ owner: userId });
    if (!venues || venues.length === 0) {
      return res.json({ message: 'No venues found', bookings: [] });
    }

    const venueIds = venues.map(v => v._id);

    // Get all bookings for these venues
    const bookings = await Booking.find({ venue: { $in: venueIds } })
      .populate('venue', 'name location capacity pricePerDay')
      .populate('user', 'name email phone')
      .sort({ eventDate: -1 });

    // Format bookings for display
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      venue: booking.venue,
      customerName: booking.customerDetails?.name || booking.user?.name || 'Unknown',
      customerEmail: booking.customerDetails?.email || booking.user?.email || 'N/A',
      customerPhone: booking.customerDetails?.phone || booking.user?.phone || 'N/A',
      eventDate: booking.eventDate,
      eventStartTime: booking.eventStartTime,
      eventEndTime: booking.eventEndTime,
      eventType: booking.eventType,
      guestCount: booking.guestCount,
      status: booking.status,
      totalAmount: booking.totalAmount,
      specialRequests: booking.specialRequests,
      services: booking.services || [],
      createdAt: booking.createdAt
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error('Error fetching venue bookings:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get bookings for a specific venue
router.get('/venue/:venueId', authMiddleware, async (req, res) => {
  try {
    const { venueId } = req.params;
    const userId = req.user.id;

    // Verify venue belongs to user
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    if (venue.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized: Not the venue owner' });
    }

    // Get all bookings for this venue
    const bookings = await Booking.find({ venue: venueId })
      .populate('user', 'name email phone')
      .sort({ eventDate: -1 });

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      customerName: booking.customerDetails?.name || booking.user?.name || 'Unknown',
      customerEmail: booking.customerDetails?.email || booking.user?.email || 'N/A',
      customerPhone: booking.customerDetails?.phone || booking.user?.phone || 'N/A',
      eventDate: booking.eventDate,
      eventStartTime: booking.eventStartTime,
      eventEndTime: booking.eventEndTime,
      eventType: booking.eventType,
      guestCount: booking.guestCount,
      status: booking.status,
      totalAmount: booking.totalAmount,
      specialRequests: booking.specialRequests,
      services: booking.services || [],
      createdAt: booking.createdAt
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update booking status (approve/reject/complete)
router.put('/owner/:bookingId/status', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(bookingId).populate('venue');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.venue.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, message: `Booking ${status} successfully`, booking });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get all bookings for a venue owner's venues
router.get('/venue-owner/my-bookings', authMiddleware, async (req, res) => {
  try {
    // Get all venues owned by this user
    const venues = await Venue.find({ owner: req.user.id });
    const venueIds = venues.map(v => v._id);

    if (venueIds.length === 0) {
      return res.json([]);
    }

    // Get all bookings for these venues
    const bookings = await Booking.find({ venue: { $in: venueIds } })
      .populate('venue', 'name location capacity pricePerDay')
      .populate('customer', 'name email')
      .populate('services', 'name type')
      .sort({ eventDate: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching venue owner bookings:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get bookings for a specific venue
router.get('/venue/:venueId/bookings', authMiddleware, async (req, res) => {
  try {
    const { venueId } = req.params;

    // Check if user owns this venue
    const venue = await Venue.findById(venueId);
    if (!venue || venue.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const bookings = await Booking.find({ venue: venueId })
      .populate('customer', 'name email')
      .populate('services', 'name type')
      .sort({ eventDate: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching venue bookings:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get all bookings for a service provider's services
router.get('/provider/service-bookings', authMiddleware, async (req, res) => {
  try {
    const Service = require('../models/Service');
    
    // Get all services created by this provider
    const services = await Service.find({ provider: req.userId });
    if (!services || services.length === 0) {
      return res.json({ message: 'No services found', bookings: [] });
    }

    const serviceIds = services.map(s => s._id);

    // Get all bookings that include these services
    const bookings = await Booking.find({ services: { $in: serviceIds } })
      .populate('customer', 'name email')
      .populate('venue', 'name location')
      .populate('services', 'name type pricing')
      .sort({ eventDate: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching service provider bookings:', err);
    res.status(500).json({ message: err.message });
  }
});

// 💳 CREATE PAYMENT REQUEST
router.post('/:bookingId/payment-request', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, description, daysUntilExpiry } = req.body;

    const booking = await Booking.findById(bookingId).populate('venue');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user is venue owner
    if (booking.venue.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized - You must be the venue owner' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Create Razorpay order for payment request
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `payment_request_${bookingId}_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    // Calculate expiry date (default 7 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (daysUntilExpiry || 7));

    const paymentRequest = {
      _id: new mongoose.Types.ObjectId(),
      amount,
      description: description || `Payment request for ${booking.eventType} event`,
      status: 'pending',
      razorpayOrderId: order.id,
      createdAt: new Date(),
      expiresAt: expiryDate
    };

    // Add payment request to booking
    if (!booking.paymentRequests) {
      booking.paymentRequests = [];
    }
    booking.paymentRequests.push(paymentRequest);
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Payment request created successfully',
      paymentRequest: {
        ...paymentRequest,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_NaH00L6fPmXM6G',
        bookingId: bookingId
      }
    });
  } catch (err) {
    console.error('Error creating payment request:', err);
    res.status(500).json({ message: 'Error creating payment request: ' + err.message });
  }
});

// 💳 GET PAYMENT REQUESTS FOR A BOOKING
router.get('/:bookingId/payment-requests', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).select('paymentRequests customerEmail customerName');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      success: true,
      paymentRequests: booking.paymentRequests || [],
      bookingId: bookingId,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName
    });
  } catch (err) {
    console.error('Error fetching payment requests:', err);
    res.status(500).json({ message: 'Error fetching payment requests: ' + err.message });
  }
});

// 💳 VERIFY PAYMENT REQUEST PAYMENT
router.post('/:bookingId/payment-request/verify', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentRequestId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!paymentRequestId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing required payment fields' });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'Dqn1m2Y4nLpY3D5xK7vZ0qA');
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const digest = hmac.digest('hex');

    if (digest !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Find booking and update the specific payment request
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Find and update the payment request
    const paymentRequest = booking.paymentRequests.find(pr => pr._id.toString() === paymentRequestId);
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    paymentRequest.status = 'paid';
    paymentRequest.razorpayPaymentId = razorpayPaymentId;
    paymentRequest.razorpaySignature = razorpaySignature;

    // Check if all payment requests are paid, then update booking payment status
    const allPaid = booking.paymentRequests.every(pr => pr.status === 'paid');
    if (allPaid) {
      booking.paymentStatus = 'completed';
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Payment request verified and marked as paid',
      paymentRequest,
      bookingPaymentStatus: booking.paymentStatus
    });
  } catch (err) {
    console.error('Error verifying payment request:', err);
    res.status(500).json({ message: 'Error verifying payment request: ' + err.message });
  }
});

// 📋 GET ALL PAYMENT REQUESTS FOR VENUE OWNER
router.get('/owner/pending-payments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all venues owned by user
    const venues = await Venue.find({ owner: userId });
    const venueIds = venues.map(v => v._id);

    if (venueIds.length === 0) {
      return res.json([]);
    }

    // Find all bookings for these venues with pending payment requests
    const bookings = await Booking.find({
      venue: { $in: venueIds }
    })
      .populate('customer', 'name email')
      .populate('venue', 'name location')
      .sort({ eventDate: -1 });

    // Filter bookings with pending payment requests
    const bookingsWithPaymentRequests = bookings
      .map(booking => ({
        _id: booking._id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        venue: booking.venue,
        eventDate: booking.eventDate,
        eventType: booking.eventType,
        paymentRequests: booking.paymentRequests || [],
        totalCost: booking.totalCost
      }))
      .filter(b => b.paymentRequests.length > 0);

    res.json(bookingsWithPaymentRequests);
  } catch (err) {
    console.error('Error fetching payment requests:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
