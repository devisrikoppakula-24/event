const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { authMiddleware } = require('../middleware/authMiddleware');

// 🔍 Get all services (public)
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isApproved: true })
      .populate('provider', 'name email mobile')
      .select('-__v');
    res.json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Error fetching services: ' + err.message });
  }
});

// 🔍 Get services by type (public)
router.get('/type/:type', async (req, res) => {
  try {
    const services = await Service.find({ type: req.params.type, isApproved: true })
      .populate('provider', 'name email mobile');
    res.json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Error fetching services: ' + err.message });
  }
});

// 📝 Get service details (public)
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'name email mobile contactNumber');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (err) {
    console.error('Error fetching service:', err);
    res.status(500).json({ message: 'Error fetching service: ' + err.message });
  }
});

// ✅ Create service (Protected - Service Provider only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, name, description, images, pricing, availability, serviceLocations, contactNumber } = req.body;

    // Validation
    if (!type || !name || !pricing) {
      return res.status(400).json({ message: 'Missing required fields (type, name, pricing)' });
    }

    const service = new Service({
      provider: req.userId,
      type,
      name,
      description,
      images: images || [],
      pricing,
      availability: availability || {
        daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri by default
        startTime: '09:00',
        endTime: '21:00'
      },
      serviceLocations: serviceLocations || [],
      contactNumber,
      isApproved: true // Auto-approved for development (change to false for production with admin approval)
    });

    await service.save();
    await service.populate('provider', 'name email mobile');

    console.log(`✅ Service created: ${name} by provider ${req.userId}`);

    res.status(201).json({
      success: true,
      message: 'Service added successfully and is now visible to customers!',
      service
    });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ message: 'Error creating service: ' + err.message });
  }
});

// 📋 Get provider's services (Protected)
router.get('/provider/:providerId/services', authMiddleware, async (req, res) => {
  try {
    const services = await Service.find({ provider: req.params.providerId });
    res.json(services);
  } catch (err) {
    console.error('Error fetching provider services:', err);
    res.status(500).json({ message: 'Error fetching services: ' + err.message });
  }
});

// ✏️ Update service (Protected - Provider only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user is provider
    if (service.provider.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only service provider can update' });
    }

    // Update fields
    Object.assign(service, req.body);
    service.updatedAt = Date.now();
    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ message: 'Error updating service: ' + err.message });
  }
});

// 🗑️ Delete service (Protected - Provider only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only service provider can delete' });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).json({ message: 'Error deleting service: ' + err.message });
  }
});

// ✅ Approve/Reject service (Admin only)
router.patch('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { isApproved } = req.body;
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    // Check if user is admin
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve services' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.isApproved = isApproved;
    await service.save();

    res.json({
      success: true,
      message: `Service ${isApproved ? 'approved' : 'rejected'} successfully`,
      service
    });
  } catch (err) {
    console.error('Error approving service:', err);
    res.status(500).json({ message: 'Error approving service: ' + err.message });
  }
});

// 📊 Get pending services (Admin only)
router.get('/admin/pending', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view pending services' });
    }

    const services = await Service.find({ isApproved: false })
      .populate('provider', 'name email mobile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (err) {
    console.error('Error fetching pending services:', err);
    res.status(500).json({ message: 'Error fetching pending services: ' + err.message });
  }
});

module.exports = router;
