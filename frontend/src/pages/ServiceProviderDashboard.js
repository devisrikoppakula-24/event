import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ServiceProviderDashboard.css';

function ServiceProviderDashboard() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'catering',
    name: '',
    description: '',
    pricing: { hourly: '', fullEvent: '' },
    serviceLocations: '',
    contactNumber: '',
    location: { latitude: '', longitude: '', address: '' },
    images: [],
    cateringMenu: { vegDishes: [], nonVegDishes: [] },
    availability: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '21:00'
    }
  });
  const [newDish, setNewDish] = useState({ type: 'veg', name: '', description: '', price: '' });

  const serviceTypes = ['catering', 'photography', 'decoration', 'guest_handler', 'makeup', 'music', 'event_manager', 'cultural'];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch bookings when tab changes
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/bookings/provider/service-bookings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('pricing.')) {
      const pricingField = name.split('.')[1];
      setFormData({
        ...formData,
        pricing: { ...formData.pricing, [pricingField]: value }
      });
    } else if (name.includes('location.')) {
      const locField = name.split('.')[1];
      setFormData({
        ...formData,
        location: { ...formData.location, [locField]: value }
      });
    } else if (name.includes('availability.')) {
      const availField = name.split('.')[1];
      setFormData({
        ...formData,
        availability: { ...formData.availability, [availField]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files) return;

    try {
      for (let file of files) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, reader.result]
          }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      alert('Error uploading image: ' + err.message);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addDish = () => {
    if (!newDish.name || !newDish.price) {
      alert('Please fill dish name and price');
      return;
    }

    const dishData = {
      name: newDish.name,
      description: newDish.description,
      price: parseInt(newDish.price)
    };

    if (newDish.type === 'veg') {
      setFormData(prev => ({
        ...prev,
        cateringMenu: {
          ...prev.cateringMenu,
          vegDishes: [...prev.cateringMenu.vegDishes, dishData]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cateringMenu: {
          ...prev.cateringMenu,
          nonVegDishes: [...prev.cateringMenu.nonVegDishes, dishData]
        }
      }));
    }

    setNewDish({ type: 'veg', name: '', description: '', price: '' });
  };

  const removeDish = (type, index) => {
    setFormData(prev => ({
      ...prev,
      cateringMenu: {
        ...prev.cateringMenu,
        [type === 'veg' ? 'vegDishes' : 'nonVegDishes']: 
          prev.cateringMenu[type === 'veg' ? 'vegDishes' : 'nonVegDishes'].filter((_, i) => i !== index)
      }
    }));
  };

  const handleDayToggle = (dayIndex) => {
    const days = formData.availability.daysOfWeek;
    if (days.includes(dayIndex)) {
      setFormData({
        ...formData,
        availability: {
          ...formData.availability,
          daysOfWeek: days.filter(d => d !== dayIndex)
        }
      });
    } else {
      setFormData({
        ...formData,
        availability: {
          ...formData.availability,
          daysOfWeek: [...days, dayIndex]
        }
      });
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.type || !formData.name || !formData.pricing.fullEvent) {
        alert('Please fill all required fields');
        setLoading(false);
        return;
      }

      const serviceData = {
        type: formData.type,
        name: formData.name,
        description: formData.description,
        pricing: {
          hourly: formData.pricing.hourly ? parseInt(formData.pricing.hourly) : 0,
          fullEvent: formData.pricing.fullEvent ? parseInt(formData.pricing.fullEvent) : 0
        },
        serviceLocations: formData.serviceLocations ? formData.serviceLocations.split(',').map(l => l.trim()) : [],
        contactNumber: formData.contactNumber,
        location: {
          latitude: formData.location.latitude ? parseFloat(formData.location.latitude) : null,
          longitude: formData.location.longitude ? parseFloat(formData.location.longitude) : null,
          address: formData.location.address
        },
        images: formData.images,
        cateringMenu: formData.type === 'catering' ? formData.cateringMenu : undefined,
        availability: formData.availability
      };

      const response = await axios.post('http://localhost:5000/api/services/', serviceData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setServices([...services, response.data.service || response.data]);
      setFormData({
        type: 'catering',
        name: '',
        description: '',
        pricing: { hourly: '', fullEvent: '' },
        serviceLocations: '',
        contactNumber: '',
        location: { latitude: '', longitude: '', address: '' },
        images: [],
        cateringMenu: { vegDishes: [], nonVegDishes: [] },
        availability: {
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '09:00',
          endTime: '21:00'
        }
      });
      setShowForm(false);
      alert('✅ Service added successfully!');
    } catch (err) {
      console.error('Error adding service:', err);
      alert('Error adding service: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/services/provider/' + localStorage.getItem('userId') + '/services', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setServices(response.data);
      } catch (err) {
        console.error('Error fetching services:', err);
      }
    };
    fetchServices();
  }, []);

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setServices(services.filter(s => s._id !== serviceId));
      alert('✅ Service deleted successfully!');
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Error deleting service: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="container">
      <div className="service-dashboard">
        <h1>🎯 Service Provider Dashboard</h1>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveTab('services')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'services' ? '#667eea' : 'transparent',
              color: activeTab === 'services' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            🎯 My Services
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'bookings' ? '#667eea' : 'transparent',
              color: activeTab === 'bookings' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            📅 Service Bookings ({bookings.length})
          </button>
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div className="dashboard-header">
          <button 
            className="btn-add-service" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '❌ Cancel' : '➕ Add New Service'}
          </button>
          <p className="service-count">Total Services: {services.length}</p>
        </div>

        {showForm && (
          <div className="add-service-form-container">
            <h2>📝 Add New Service</h2>
            <form onSubmit={handleAddService} className="add-service-form">
              
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label>Service Type *</label>
                  <select 
                    name="type" 
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  >
                    {serviceTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Premium Catering Service"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your service..."
                    disabled={loading}
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Contact Number</label>
                  <input 
                    type="tel" 
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 9876543210"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>🖼️ Upload Images</h3>
                <div className="form-group">
                  <label>Upload Service Images</label>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                  <p className="help-text">Upload multiple photos of your service</p>
                </div>

                {formData.images.length > 0 && (
                  <div className="image-gallery">
                    <h4>Preview ({formData.images.length} images)</h4>
                    <div className="images-grid">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="image-item">
                          <img src={img} alt={`Service ${idx}`} />
                          <button 
                            type="button"
                            className="btn-remove-image"
                            onClick={() => removeImage(idx)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3>📍 Location</h3>
                
                <div className="form-group">
                  <label>Service Address</label>
                  <input 
                    type="text" 
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    placeholder="e.g., Mumbai, Maharashtra"
                    disabled={loading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Latitude</label>
                    <input 
                      type="number" 
                      name="location.latitude"
                      value={formData.location.latitude}
                      onChange={handleInputChange}
                      placeholder="e.g., 19.0760"
                      disabled={loading}
                      step="any"
                    />
                  </div>

                  <div className="form-group">
                    <label>Longitude</label>
                    <input 
                      type="number" 
                      name="location.longitude"
                      value={formData.location.longitude}
                      onChange={handleInputChange}
                      placeholder="e.g., 72.8777"
                      disabled={loading}
                      step="any"
                    />
                  </div>
                </div>
                <p className="help-text">📌 Get GPS coordinates from Google Maps</p>
              </div>

              <div className="form-section">
                <h3>💰 Pricing</h3>
                
                <div className="form-group">
                  <label>Hourly Rate (Optional)</label>
                  <input 
                    type="number" 
                    name="pricing.hourly"
                    value={formData.pricing.hourly}
                    onChange={handleInputChange}
                    placeholder="e.g., 500"
                    disabled={loading}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Full Event Price *</label>
                  <input 
                    type="number" 
                    name="pricing.fullEvent"
                    value={formData.pricing.fullEvent}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000"
                    disabled={loading}
                    min="0"
                    required
                  />
                </div>
              </div>

              {formData.type === 'catering' && (
                <div className="form-section">
                  <h3>🍽️ Catering Menu</h3>
                  
                  <div className="menu-input">
                    <div className="form-group">
                      <label>Dish Type</label>
                      <select 
                        value={newDish.type}
                        onChange={(e) => setNewDish({...newDish, type: e.target.value})}
                      >
                        <option value="veg">🥬 Vegetarian</option>
                        <option value="nonveg">🍗 Non-Vegetarian</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Dish Name</label>
                      <input 
                        type="text"
                        value={newDish.name}
                        onChange={(e) => setNewDish({...newDish, name: e.target.value})}
                        placeholder="e.g., Butter Chicken"
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <input 
                        type="text"
                        value={newDish.description}
                        onChange={(e) => setNewDish({...newDish, description: e.target.value})}
                        placeholder="e.g., Creamy tomato sauce"
                      />
                    </div>

                    <div className="form-group">
                      <label>Price per plate</label>
                      <input 
                        type="number"
                        value={newDish.price}
                        onChange={(e) => setNewDish({...newDish, price: e.target.value})}
                        placeholder="e.g., 200"
                        min="0"
                      />
                    </div>

                    <button 
                      type="button"
                      className="btn-add-dish"
                      onClick={addDish}
                    >
                      ➕ Add Dish
                    </button>
                  </div>

                  {(formData.cateringMenu.vegDishes.length > 0 || formData.cateringMenu.nonVegDishes.length > 0) && (
                    <div className="menu-display">
                      {formData.cateringMenu.vegDishes.length > 0 && (
                        <div className="menu-group">
                          <h4>🥬 Vegetarian Dishes</h4>
                          {formData.cateringMenu.vegDishes.map((dish, idx) => (
                            <div key={idx} className="menu-item">
                              <div>
                                <strong>{dish.name}</strong>
                                {dish.description && <p>{dish.description}</p>}
                                <span className="price">₹{dish.price}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeDish('veg', idx)}
                                className="btn-remove"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {formData.cateringMenu.nonVegDishes.length > 0 && (
                        <div className="menu-group">
                          <h4>🍗 Non-Vegetarian Dishes</h4>
                          {formData.cateringMenu.nonVegDishes.map((dish, idx) => (
                            <div key={idx} className="menu-item">
                              <div>
                                <strong>{dish.name}</strong>
                                {dish.description && <p>{dish.description}</p>}
                                <span className="price">₹{dish.price}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeDish('nonveg', idx)}
                                className="btn-remove"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="form-section">
                <h3>📅 Availability</h3>
                
                <div className="form-group">
                  <label>Available Days of Week</label>
                  <div className="days-selector">
                    {daysOfWeek.map((day, index) => (
                      <label key={index} className="day-checkbox">
                        <input 
                          type="checkbox"
                          checked={formData.availability.daysOfWeek.includes(index)}
                          onChange={() => handleDayToggle(index)}
                          disabled={loading}
                        />
                        {day.substring(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input 
                      type="time" 
                      name="availability.startTime"
                      value={formData.availability.startTime}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time</label>
                    <input 
                      type="time" 
                      name="availability.endTime"
                      value={formData.availability.endTime}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>📍 Service Locations</h3>
                <div className="form-group">
                  <label>Service Locations (comma-separated)</label>
                  <textarea 
                    name="serviceLocations"
                    value={formData.serviceLocations}
                    onChange={handleInputChange}
                    placeholder="e.g., Mumbai, Pune, Nashik"
                    disabled={loading}
                    rows="2"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? '⏳ Adding Service...' : '✅ Add Service'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="services-list">
          <h2>📋 Your Services</h2>
          {services.length === 0 ? (
            <div className="no-services">
              <p>No services added yet</p>
              <button 
                className="btn-add-service-secondary"
                onClick={() => setShowForm(true)}
              >
                ➕ Add Your First Service
              </button>
            </div>
          ) : (
            <div className="services-grid">
              {services.map(service => (
                <div key={service._id} className="service-card">
                  {service.images && service.images.length > 0 && (
                    <div className="service-image">
                      <img src={service.images[0]} alt={service.name} />
                    </div>
                  )}

                  <div className="service-details">
                    <h3>{service.name}</h3>
                    
                    <div className="detail-item">
                      <span>🏷️ Type:</span>
                      <strong>{service.type.replace('_', ' ').toUpperCase()}</strong>
                    </div>

                    {service.description && (
                      <div className="detail-item">
                        <span>📝 Description:</span>
                        <p>{service.description}</p>
                      </div>
                    )}

                    <div className="detail-item">
                      <span>💰 Pricing:</span>
                      <div>
                        {service.pricing.hourly > 0 && <p>Hourly: ₹{service.pricing.hourly}</p>}
                        <p>Full Event: ₹{service.pricing.fullEvent}</p>
                      </div>
                    </div>

                    {service.location && service.location.address && (
                      <div className="detail-item">
                        <span>📍 Location:</span>
                        <strong>{service.location.address}</strong>
                      </div>
                    )}

                    {service.contactNumber && (
                      <div className="detail-item">
                        <span>📞 Contact:</span>
                        <strong>{service.contactNumber}</strong>
                      </div>
                    )}

                    {service.serviceLocations && service.serviceLocations.length > 0 && (
                      <div className="detail-item">
                        <span>📍 Covers:</span>
                        <div className="tags">
                          {service.serviceLocations.map((loc, i) => (
                            <span key={i} className="tag">{loc}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="detail-item">
                      <span>📅 Availability:</span>
                      <p>{service.availability.daysOfWeek.map(d => daysOfWeek[d].substring(0, 3)).join(', ')} | {service.availability.startTime}-{service.availability.endTime}</p>
                    </div>

                    <div className="service-status">
                      <span>Status: {service.isApproved ? '✅ Approved' : '⏳ Pending Approval'}</span>
                    </div>
                  </div>

                  <div className="service-actions">
                    <button className="btn-edit">✏️ Edit</button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteService(service._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2>📅 Service Bookings</h2>
            {bookingsLoading ? (
              <p>Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', color: '#666' }}>No service bookings yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {bookings.map(booking => (
                  <div key={booking._id} style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                      <div>
                        <h3>{booking.venue?.name}</h3>
                        <p style={{ color: '#666', margin: '5px 0' }}>📍 {booking.venue?.location}</p>
                      </div>
                      <span style={{ padding: '8px 12px', borderRadius: '4px', background: booking.status === 'confirmed' ? '#d4edda' : booking.status === 'cancelled' ? '#f8d7da' : '#fff3cd', color: booking.status === 'confirmed' ? '#155724' : booking.status === 'cancelled' ? '#721c24' : '#856404', fontWeight: '600' }}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <p><strong>👤 Customer:</strong> {booking.customer?.name}</p>
                        <p><strong>📧 Email:</strong> {booking.customer?.email}</p>
                      </div>
                      <div>
                        <p><strong>📅 Event Date:</strong> {new Date(booking.eventDate).toDateString()}</p>
                        <p><strong>⏰ Time:</strong> {booking.eventStartTime} - {booking.eventEndTime}</p>
                      </div>
                      <div>
                        <p><strong>🎭 Event Type:</strong> {booking.eventType}</p>
                        <p><strong>👥 Guests:</strong> {booking.guestCount}</p>
                      </div>
                      <div>
                        <p><strong>💰 Total Cost:</strong> ₹{booking.totalCost}</p>
                        <p><strong>Payment:</strong> <span style={{ color: booking.paymentStatus === 'completed' ? 'green' : 'orange' }}>{booking.paymentStatus || 'Pending'}</span></p>
                      </div>
                    </div>

                    {booking.services && booking.services.length > 0 && (
                      <div>
                        <p><strong>🎯 My Services Booked:</strong></p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {booking.services.map(service => (
                            <span key={service._id} style={{ background: '#667eea', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                              {service.name} - ₹{service.pricing.fullEvent}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {booking.specialRequests && (
                      <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginTop: '15px' }}>
                        <p><strong>📝 Special Requests:</strong> {booking.specialRequests}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceProviderDashboard;
