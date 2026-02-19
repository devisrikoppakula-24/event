const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { authMiddleware } = require('../middleware/authMiddleware');

// 🤖 AI Venue Recommendations based on user preferences
router.post('/venues', authMiddleware, async (req, res) => {
  try {
    const { eventType, guestCount, budget, location, eventDate, preferences } = req.body;

    let recommendedVenues = await Venue.find({ isApproved: true })
      .populate('owner', 'name email')
      .populate('reviews', 'rating');

    // Score calculation
    const scoredVenues = recommendedVenues.map(venue => {
      let score = 0;
      let reasonsForRecommendation = [];

      // 1. Location match (highest weight: 30)
      if (location) {
        const locationWeight = venue.location.toLowerCase().includes(location.toLowerCase()) ? 30 : 0;
        score += locationWeight;
        if (locationWeight > 0) {
          reasonsForRecommendation.push('Matches your preferred location');
        }
      }

      // 2. Capacity match (weight: 25)
      if (guestCount) {
        const capacityMargin = venue.capacity - guestCount;
        if (capacityMargin >= 0 && capacityMargin <= guestCount * 0.2) {
          // Perfect fit (within 20% extra)
          score += 25;
          reasonsForRecommendation.push(`Perfect capacity for ${guestCount} guests`);
        } else if (capacityMargin > 0 && capacityMargin <= guestCount) {
          // Good fit
          score += 15;
          reasonsForRecommendation.push(`Good capacity for ${guestCount} guests`);
        } else if (capacityMargin > guestCount && capacityMargin <= guestCount * 2) {
          // Slightly larger but okay
          score += 10;
        }
      }

      // 3. Price match (weight: 25)
      if (budget) {
        const priceRatio = venue.pricePerDay / budget;
        if (priceRatio <= 1) {
          // Within budget
          score += 25;
          reasonsForRecommendation.push('Within your budget');
        } else if (priceRatio <= 1.2) {
          // Slightly over but acceptable
          score += 15;
          reasonsForRecommendation.push('Near your budget');
        } else if (priceRatio <= 1.5) {
          // Moderately over
          score += 8;
        }
      }

      // 4. Rating & Reviews (weight: 15)
      if (venue.ratings && venue.ratings > 0) {
        const ratingScore = (venue.ratings / 5) * 15;
        score += ratingScore;
        reasonsForRecommendation.push(`⭐ Highly rated (${venue.ratings}/5)`);
      }

      // 5. Facilities match (weight: 10)
      if (preferences && preferences.facilities && Array.isArray(preferences.facilities)) {
        const matchedFacilities = preferences.facilities.filter(fac =>
          venue.facilities && venue.facilities.some(vfac =>
            vfac.toLowerCase().includes(fac.toLowerCase())
          )
        );
        score += (matchedFacilities.length / preferences.facilities.length) * 10;
        if (matchedFacilities.length > 0) {
          reasonsForRecommendation.push(`Has ${matchedFacilities.join(', ')} facilities`);
        }
      }

      // 6. Catering options match (weight: 5)
      if (preferences && preferences.cateringPreference) {
        if (venue.cateringOptions && venue.cateringOptions.some(opt =>
          opt.toLowerCase().includes(preferences.cateringPreference.toLowerCase())
        )) {
          score += 5;
          reasonsForRecommendation.push(`Offers ${preferences.cateringPreference} catering`);
        }
      }

      // 7. Availability (weight: 5)
      if (eventDate && venue.availableDates) {
        const isAvailable = venue.availableDates.some(date =>
          new Date(date).toLocaleDateString() === new Date(eventDate).toLocaleDateString()
        );
        if (isAvailable) {
          score += 5;
          reasonsForRecommendation.push('Available on your event date');
        }
      }

      return {
        ...venue.toObject(),
        recommendationScore: score,
        reasonsForRecommendation: reasonsForRecommendation
      };
    });

    // Sort by score descending
    const topRecommendations = scoredVenues
      .filter(v => v.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10);

    // If no venues match criteria, return top-rated venues
    const finalRecommendations = topRecommendations.length > 0
      ? topRecommendations
      : scoredVenues.sort((a, b) => (b.ratings || 0) - (a.ratings || 0)).slice(0, 10);

    res.json({
      success: true,
      count: finalRecommendations.length,
      recommendations: finalRecommendations,
      criteria: { eventType, guestCount, budget, location, eventDate }
    });
  } catch (err) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ message: 'Error generating recommendations: ' + err.message });
  }
});

// 🤖 AI Service Recommendations based on service type and quality
router.post('/services', authMiddleware, async (req, res) => {
  try {
    const { serviceType, location, budget, preferences } = req.body;

    let recommendedServices = await Service.find({
      isApproved: true,
      type: serviceType
    })
      .populate('provider', 'name email mobile')
      .populate('reviews', 'rating');

    const scoredServices = recommendedServices.map(service => {
      let score = 0;
      let reasonsForRecommendation = [];

      // 1. Location match (weight: 30)
      if (location && service.serviceLocations) {
        const locationWeight = service.serviceLocations.some(loc =>
          loc.toLowerCase().includes(location.toLowerCase())
        ) ? 30 : 0;
        score += locationWeight;
        if (locationWeight > 0) {
          reasonsForRecommendation.push('Serves your location');
        }
      }

      // 2. Rating (weight: 30)
      if (service.ratings && service.ratings > 0) {
        score += (service.ratings / 5) * 30;
        reasonsForRecommendation.push(`⭐ Highly rated (${service.ratings}/5)`);
      }

      // 3. Price match (weight: 25)
      if (budget && service.pricing) {
        const avgPrice = (service.pricing.hourly || 0 + service.pricing.fullEvent || 0) / 2;
        if (avgPrice <= budget) {
          score += 25;
          reasonsForRecommendation.push('Within your budget');
        } else if (avgPrice <= budget * 1.2) {
          score += 15;
          reasonsForRecommendation.push('Near your budget');
        } else if (avgPrice <= budget * 1.5) {
          score += 8;
        }
      }

      // 4. Availability (weight: 15)
      if (service.availability) {
        if (service.availability.daysOfWeek && service.availability.daysOfWeek.length >= 6) {
          score += 15;
          reasonsForRecommendation.push('Highly available');
        } else if (service.availability.daysOfWeek && service.availability.daysOfWeek.length >= 4) {
          score += 10;
        }
      }

      return {
        ...service.toObject(),
        recommendationScore: score,
        reasonsForRecommendation: reasonsForRecommendation
      };
    });

    const topRecommendations = scoredServices
      .filter(s => s.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10);

    const finalRecommendations = topRecommendations.length > 0
      ? topRecommendations
      : scoredServices.sort((a, b) => (b.ratings || 0) - (a.ratings || 0)).slice(0, 10);

    res.json({
      success: true,
      count: finalRecommendations.length,
      recommendations: finalRecommendations,
      criteria: { serviceType, location, budget }
    });
  } catch (err) {
    console.error('Error generating service recommendations:', err);
    res.status(500).json({ message: 'Error generating recommendations: ' + err.message });
  }
});

// 🤖 Personalized Recommendations (based on user's booking history)
router.get('/personalized', authMiddleware, async (req, res) => {
  try {
    // Get user's booking history
    const userBookings = await Booking.find({ customerId: req.userId })
      .populate('venueId')
      .sort({ createdAt: -1 })
      .limit(5);

    if (userBookings.length === 0) {
      // Return trending venues if no history
      const trendingVenues = await Venue.find({ isApproved: true })
        .sort({ ratings: -1 })
        .limit(10)
        .populate('owner', 'name email');

      return res.json({
        success: true,
        type: 'trending',
        recommendations: trendingVenues.map(v => ({
          ...v.toObject(),
          reasonsForRecommendation: ['Trending on EventHub']
        }))
      });
    }

    // Extract preferences from booking history
    const preferences = {
      eventTypes: userBookings.map(b => b.eventType),
      avgBudget: userBookings.reduce((sum, b) => sum + (b.venueId?.pricePerDay || 0), 0) / userBookings.length,
      locations: userBookings.map(b => b.venueId?.location).filter(l => l),
      facilities: []
    };

    // Find similar venues
    const similarVenues = await Venue.find({
      isApproved: true,
      location: { $in: preferences.locations }
    })
      .populate('owner', 'name email')
      .limit(10);

    const scoredVenues = similarVenues.map(venue => {
      let score = 0;
      let reasonsForRecommendation = [];

      // Location match
      if (preferences.locations.some(loc =>
        venue.location.toLowerCase().includes(loc.toLowerCase())
      )) {
        score += 30;
        reasonsForRecommendation.push('Popular in your area');
      }

      // Price proximity
      const priceDiff = Math.abs(venue.pricePerDay - preferences.avgBudget);
      score += Math.max(0, 25 - (priceDiff / preferences.avgBudget) * 25);
      if (priceDiff < preferences.avgBudget * 0.1) {
        reasonsForRecommendation.push('Similar to your past bookings');
      }

      // Rating
      if (venue.ratings > 4) {
        score += 25;
        reasonsForRecommendation.push(`⭐ Highly rated (${venue.ratings}/5)`);
      }

      // Facilities
      if (venue.facilities && venue.facilities.length > 0) {
        score += 10;
        reasonsForRecommendation.push(`Offers ${venue.facilities.slice(0, 2).join(', ')}`);
      }

      return {
        ...venue.toObject(),
        recommendationScore: score,
        reasonsForRecommendation
      };
    });

    const finalRecommendations = scoredVenues
      .sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json({
      success: true,
      type: 'personalized',
      message: 'Venues tailored to your preferences',
      recommendations: finalRecommendations,
      userProfile: preferences
    });
  } catch (err) {
    console.error('Error generating personalized recommendations:', err);
    res.status(500).json({ message: 'Error generating recommendations: ' + err.message });
  }
});

module.exports = router;
