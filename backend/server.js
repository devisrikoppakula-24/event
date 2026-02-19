const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB
connectDB();

// ✅ Health Check Route
app.get('/', (req, res) => {
  res.json({
    message: '🎉 EventHub API Server Running',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      venues: '/api/venues',
      services: '/api/services',
      bookings: '/api/bookings',
      payments: '/api/payments',
      invoices: '/api/invoices',
      reviews: '/api/reviews',
      messages: '/api/messages',
      recommendations: '/api/recommendations'
    },
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/venues', require('./routes/venueRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
