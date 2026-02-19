const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Service = require('../models/Service');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const { authMiddleware } = require('../middleware/authMiddleware');

// ✅ Submit Review for Service
router.post('/service/:serviceId', authMiddleware, async (req, res) => {
  try {
    const { rating, title, comment, serviceQuality, timeliness, valueForMoney, images, bookingId } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Review comment is required' });
    }

    // Check if service exists
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user already reviewed (optional - allows multiple reviews)
    const existingReview = await Review.findOne({
      serviceId: req.params.serviceId,
      customerId: req.userId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this service' });
    }

    const review = new Review({
      serviceId: req.params.serviceId,
      customerId: req.userId,
      customerName: req.body.customerName,
      rating,
      title,
      comment,
      serviceQuality: serviceQuality || rating,
      timeliness: timeliness || rating,
      valueForMoney: valueForMoney || rating,
      images: images || [],
      bookingId,
      isVerified: !!bookingId
    });

    await review.save();

    // Update service rating aggregate
    await updateServiceRating(req.params.serviceId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! Thank you for your feedback.',
      review
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ message: 'Error submitting review: ' + err.message });
  }
});

// ✅ Submit Review for Venue
router.post('/venue/:venueId', authMiddleware, async (req, res) => {
  try {
    const { rating, title, comment, ambiance, cleanliness, facilities, staff, images, bookingId } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Review comment is required' });
    }

    // Check if venue exists
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    const review = new Review({
      venueId: req.params.venueId,
      customerId: req.userId,
      customerName: req.body.customerName,
      rating,
      title,
      comment,
      ambiance: ambiance || rating,
      cleanliness: cleanliness || rating,
      facilities: facilities || rating,
      staff: staff || rating,
      images: images || [],
      bookingId,
      isVerified: !!bookingId
    });

    await review.save();

    // Update venue rating aggregate
    await updateVenueRating(req.params.venueId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! Thank you for your feedback.',
      review
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ message: 'Error submitting review: ' + err.message });
  }
});

// 🔍 Get Reviews for Service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const reviews = await Review.find({
      serviceId: req.params.serviceId,
      isApproved: true
    })
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('customerId', 'name profileImage');

    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
      total: reviews.length,
      average: 0
    };

    let totalRating = 0;
    reviews.forEach(review => {
      ratingBreakdown[review.rating]++;
      totalRating += review.rating;
    });

    if (reviews.length > 0) {
      ratingBreakdown.average = (totalRating / reviews.length).toFixed(1);
    }

    res.json({
      success: true,
      reviews,
      ratingBreakdown
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: 'Error fetching reviews: ' + err.message });
  }
});

// 🔍 Get Reviews for Venue
router.get('/venue/:venueId', async (req, res) => {
  try {
    const reviews = await Review.find({
      venueId: req.params.venueId,
      isApproved: true
    })
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('customerId', 'name profileImage');

    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
      total: reviews.length,
      average: 0
    };

    let totalRating = 0;
    reviews.forEach(review => {
      ratingBreakdown[review.rating]++;
      totalRating += review.rating;
    });

    if (reviews.length > 0) {
      ratingBreakdown.average = (totalRating / reviews.length).toFixed(1);
    }

    res.json({
      success: true,
      reviews,
      ratingBreakdown
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: 'Error fetching reviews: ' + err.message });
  }
});

// ✅ Mark Review as Helpful
router.post('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.helpfulCount = (review.helpfulCount || 0) + 1;
    await review.save();

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      helpfulCount: review.helpfulCount
    });
  } catch (err) {
    console.error('Error updating helpful count:', err);
    res.status(500).json({ message: 'Error updating helpful count: ' + err.message });
  }
});

// ✅ Delete Review (only owner or admin)
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.customerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(req.params.reviewId);

    // Update ratings
    if (review.serviceId) {
      await updateServiceRating(review.serviceId);
    }
    if (review.venueId) {
      await updateVenueRating(review.venueId);
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: 'Error deleting review: ' + err.message });
  }
});

// Helper function to update service rating
async function updateServiceRating(serviceId) {
  try {
    const reviews = await Review.find({ serviceId, isApproved: true });
    if (reviews.length === 0) {
      await Service.findByIdAndUpdate(serviceId, { ratings: 0 });
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Service.findByIdAndUpdate(serviceId, { ratings: parseFloat(avgRating.toFixed(1)) });
  } catch (err) {
    console.error('Error updating service rating:', err);
  }
}

// Helper function to update venue rating
async function updateVenueRating(venueId) {
  try {
    const reviews = await Review.find({ venueId, isApproved: true });
    if (reviews.length === 0) {
      await Venue.findByIdAndUpdate(venueId, { ratings: 0 });
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Venue.findByIdAndUpdate(venueId, { ratings: parseFloat(avgRating.toFixed(1)) });
  } catch (err) {
    console.error('Error updating venue rating:', err);
  }
}

module.exports = router;
