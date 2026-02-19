const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// 🔍 Get venues by location (public)
router.get('/search', async (req, res) => {
  try {
    const { location } = req.query;
    
    // For now, show all venues (approved or not) for venue owner to see their own
    let query = {};
    if (location && location !== 'all') {
      query.location = { $regex: location, $options: 'i' }; // Case-insensitive search
    }

    const venues = await Venue.find(query)
      .populate('owner', 'name contactNumber email');
    
    // Ensure numeric values in response
    const formattedVenues = venues.map(venue => {
      const venueObj = venue.toObject();
      return {
        ...venueObj,
        capacity: venueObj.capacity ? parseInt(venueObj.capacity) : 0,
        pricePerDay: venueObj.pricePerDay ? parseInt(venueObj.pricePerDay) : 0
      };
    });
    
    res.json(formattedVenues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📍 Get venue details (public)
router.get('/:id', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate('owner', 'name email mobile contactNumber');
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json(venue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Create venue (Protected - Venue Owner only)
router.post('/', authMiddleware, authorize(['venue_owner']), async (req, res) => {
  try {
    const { name, location, capacity, pricePerDay, description, images, facilities, cateringOptions } = req.body;

    // Validation
    if (!name || !location || !capacity || !pricePerDay) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Create venue
    const venue = new Venue({
      owner: req.user.id,
      name,
      location,
      capacity,
      pricePerDay,
      description,
      images, // Base64 strings or URLs
      facilities: facilities || [],
      cateringOptions: cateringOptions || [],
      isApproved: false // Admin will approve
    });

    const savedVenue = await venue.save();
    console.log(`✅ Venue created: ${name} by user ${req.user.id}`);

    // Convert capacity and pricePerDay to numbers for consistency
    const responseVenue = {
      ...savedVenue.toObject(),
      capacity: parseInt(savedVenue.capacity),
      pricePerDay: parseInt(savedVenue.pricePerDay)
    };

    res.status(201).json({
      success: true,
      message: 'Venue added successfully! (Pending admin approval)',
      venue: responseVenue
    });
  } catch (err) {
    console.error('Error creating venue:', err.message);
    res.status(500).json({ message: 'Error creating venue: ' + err.message });
  }
});

// ✏️ Update venue (Protected - Owner only)
router.put('/:id', authMiddleware, authorize(['venue_owner']), async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Check if user is owner
    if (venue.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only venue owner can update' });
    }

    // Update fields
    Object.assign(venue, req.body);
    venue.updatedAt = Date.now();
    await venue.save();

    console.log(`✅ Venue updated: ${venue.name}`);
    res.json({ success: true, message: 'Venue updated', venue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🗑️ Delete venue (Protected - Owner only)
router.delete('/:id', authMiddleware, authorize(['venue_owner']), async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Check if user is owner
    if (venue.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only venue owner can delete' });
    }

    await Venue.findByIdAndDelete(req.params.id);
    console.log(`✅ Venue deleted: ${venue.name}`);

    res.json({ success: true, message: 'Venue deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📊 Get owner's venues (Protected - Venue Owner only)
router.get('/owner/:ownerId', authMiddleware, authorize(['venue_owner']), async (req, res) => {
  try {
    const venues = await Venue.find({ owner: req.params.ownerId });
    res.json(venues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
