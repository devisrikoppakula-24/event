import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VenueOwnerDashboard.css';

function VenueOwnerDashboard() {
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('venues');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [paymentRequestsLoading, setPaymentRequestsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [paymentRequestForm, setPaymentRequestForm] = useState({
    amount: '',
    description: '',
    daysUntilExpiry: 7
  });
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    pricePerDay: '',
    description: '',
    facilities: '',
    cateringOptions: ''
  });

  const userId = localStorage.getItem('userId');

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result); // Base64 string
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(base64Images => {
      setImages([...images, ...base64Images]);
    });
  };

  // Remove image from preview
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Add venue
  const handleAddVenue = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.location || !formData.capacity || !formData.pricePerDay) {
        alert('Please fill all required fields');
        setLoading(false);
        return;
      }

      if (images.length === 0) {
        alert('Please upload at least one image');
        setLoading(false);
        return;
      }

      const venueData = {
        owner: userId,
        name: formData.name,
        location: formData.location,
        capacity: parseInt(formData.capacity),
        pricePerDay: parseInt(formData.pricePerDay),
        description: formData.description,
        images: images,
        facilities: formData.facilities ? formData.facilities.split(',').map(f => f.trim()) : [],
        cateringOptions: formData.cateringOptions ? formData.cateringOptions.split(',').map(c => c.trim()) : [],
        ratings: 0,
        reviews: []
      };

      const response = await axios.post('http://localhost:5000/api/venues/', venueData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setVenues([...venues, response.data]);
      setFormData({
        name: '',
        location: '',
        capacity: '',
        pricePerDay: '',
        description: '',
        facilities: '',
        cateringOptions: ''
      });
      setImages([]);
      setShowForm(false);
      alert('✅ Venue added successfully!');
    } catch (err) {
      console.error('Error adding venue:', err);
      alert('Error adding venue: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch venues on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchVenues();
  }, []);

  // Fetch bookings when tab changes
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'payments') {
      fetchPaymentRequests();
    }
  }, [activeTab]);

  const fetchVenues = async () => {
    try {
      // Get only venues owned by current user
      const response = await axios.get('http://localhost:5000/api/venues/search?location=all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Filter venues to only show those owned by current user
      const myVenues = response.data.filter(venue => venue.owner === userId);
      setVenues(myVenues);
    } catch (err) {
      console.error('Error fetching venues:', err);
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/bookings/venue-owner/my-bookings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchPaymentRequests = async () => {
    setPaymentRequestsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/bookings/owner/pending-payments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPaymentRequests(response.data);
    } catch (err) {
      console.error('Error fetching payment requests:', err);
    } finally {
      setPaymentRequestsLoading(false);
    }
  };

  const handleCreatePaymentRequest = async (bookingId) => {
    if (!paymentRequestForm.amount || parseInt(paymentRequestForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/bookings/${bookingId}/payment-request`,
        {
          amount: parseInt(paymentRequestForm.amount) * 100, // Convert to paise
          description: paymentRequestForm.description || 'Payment request for event booking',
          daysUntilExpiry: parseInt(paymentRequestForm.daysUntilExpiry)
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        alert('✅ Payment request created successfully!');
        setPaymentRequestForm({ amount: '', description: '', daysUntilExpiry: 7 });
        setSelectedBookingForPayment(null);
        fetchPaymentRequests();
      }
    } catch (err) {
      console.error('Error creating payment request:', err);
      alert('Error creating payment request: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="container">
      <div className="venue-dashboard">
        <h1>🏛️ Venue Owner Dashboard</h1>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveTab('venues')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'venues' ? '#667eea' : 'transparent',
              color: activeTab === 'venues' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            🏛️ My Venues
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
            📅 Bookings ({bookings.length})
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'payments' ? '#667eea' : 'transparent',
              color: activeTab === 'payments' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            💳 Payment Requests ({paymentRequests.flat().reduce((acc, b) => acc + (b.paymentRequests?.length || 0), 0)})
          </button>
        </div>

        {/* Venues Tab */}
        {activeTab === 'venues' && (
        <div>
        {/* Add Venue Button */}
        <div className="dashboard-header">
          <button 
            className="btn-add-venue" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '❌ Cancel' : '➕ Add New Venue'}
          </button>
          <p className="venue-count">Total Venues: {venues.length}</p>
        </div>

        {/* Add Venue Form */}
        {showForm && (
          <div className="add-venue-form-container">
            <h2>📝 Add New Venue</h2>
            <form onSubmit={handleAddVenue} className="add-venue-form">
              
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label>Venue Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Grand Palace Banquet Hall"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      name="location"
                      placeholder="e.g., Mumbai, Delhi, Bangalore"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Seating Capacity *</label>
                    <input
                      type="number"
                      name="capacity"
                      placeholder="e.g., 500"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Price per Day/Event *</label>
                    <input
                      type="number"
                      name="pricePerDay"
                      placeholder="e.g., 50000"
                      value={formData.pricePerDay}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    placeholder="Describe your venue (amenities, ambiance, etc.)"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Facilities & Services */}
              <div className="form-section">
                <h3>Facilities & Services</h3>
                
                <div className="form-group">
                  <label>Facilities (comma-separated)</label>
                  <input
                    type="text"
                    name="facilities"
                    placeholder="e.g., Parking, Wi-Fi, AC, Projector, Sound System"
                    value={formData.facilities}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <small>📌 Separate with commas</small>
                </div>

                <div className="form-group">
                  <label>Catering Options (comma-separated)</label>
                  <input
                    type="text"
                    name="cateringOptions"
                    placeholder="e.g., Vegetarian, Non-Vegetarian, Vegan, Desserts"
                    value={formData.cateringOptions}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <small>📌 Separate with commas</small>
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-section">
                <h3>🖼️ Upload Venue Images *</h3>
                
                <div className="image-upload-box">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={loading}
                    id="image-upload"
                    className="file-input"
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    📸 Click to select images or drag & drop
                  </label>
                </div>

                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="image-preview">
                    <h4>Selected Images ({images.length})</h4>
                    <div className="preview-grid">
                      {images.map((image, index) => (
                        <div key={index} className="preview-item">
                          <img src={image} alt={`Preview ${index + 1}`} />
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => removeImage(index)}
                            disabled={loading}
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? '⏳ Adding Venue...' : '✅ Add Venue'}
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

        {/* Venues List */}
        <div className="venues-list">
          <h2>📋 Your Venues</h2>
          {venues.length === 0 ? (
            <div className="no-venues">
              <p>No venues added yet</p>
              <button 
                className="btn-add-venue-secondary"
                onClick={() => setShowForm(true)}
              >
                ➕ Add Your First Venue
              </button>
            </div>
          ) : (
            <div className="venues-grid">
              {venues.map(venue => (
                <div key={venue._id} className="venue-card">
                  {/* Venue Image */}
                  <div className="venue-image">
                    {venue.images && venue.images.length > 0 ? (
                      <img src={venue.images[0]} alt={venue.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>

                  {/* Venue Details */}
                  <div className="venue-details">
                    <h3>{venue.name}</h3>
                    
                    <div className="detail-item">
                      <span>📍 Location:</span>
                      <strong>{venue.location}</strong>
                    </div>

                    <div className="detail-item">
                      <span>👥 Capacity:</span>
                      <strong>{venue.capacity} people</strong>
                    </div>

                    <div className="detail-item">
                      <span>💰 Price:</span>
                      <strong>₹{(venue.pricePerDay && !isNaN(parseInt(venue.pricePerDay))) ? parseInt(venue.pricePerDay).toLocaleString() : '0'}/day</strong>
                    </div>

                    {venue.description && (
                      <div className="detail-item">
                        <span>📝 Description:</span>
                        <p>{venue.description}</p>
                      </div>
                    )}

                    {venue.facilities && venue.facilities.length > 0 && (
                      <div className="detail-item">
                        <span>🏢 Facilities:</span>
                        <div className="tags">
                          {venue.facilities.map((f, i) => (
                            <span key={i} className="tag">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {venue.cateringOptions && venue.cateringOptions.length > 0 && (
                      <div className="detail-item">
                        <span>🍽️ Catering:</span>
                        <div className="tags">
                          {venue.cateringOptions.map((c, i) => (
                            <span key={i} className="tag">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {venue.images && venue.images.length > 0 && (
                      <div className="detail-item">
                        <span>🖼️ Images:</span>
                        <strong>{venue.images.length} photos</strong>
                      </div>
                    )}

                    <div className="venue-rating">
                      <span>⭐ Rating: {venue.ratings || 'No ratings yet'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="venue-actions">
                    <button className="btn-edit">✏️ Edit</button>
                    <button className="btn-delete">🗑️ Delete</button>
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
            <h2>📅 Customer Bookings</h2>
            {bookingsLoading ? (
              <p>Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', color: '#666' }}>No bookings yet</p>
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

                    {booking.specialRequests && (
                      <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                        <p><strong>📝 Special Requests:</strong> {booking.specialRequests}</p>
                      </div>
                    )}

                    {booking.services && booking.services.length > 0 && (
                      <div>
                        <p><strong>🎯 Services Included:</strong></p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {booking.services.map(service => (
                            <span key={service._id} style={{ background: '#667eea', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                              {service.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => setSelectedBookingForPayment(selectedBookingForPayment === booking._id ? null : booking._id)}
                      style={{
                        marginTop: '15px',
                        padding: '10px 20px',
                        background: selectedBookingForPayment === booking._id ? '#ff6b6b' : '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem'
                      }}
                    >
                      {selectedBookingForPayment === booking._id ? '❌ Cancel' : '💳 Request Payment'}
                    </button>

                    {selectedBookingForPayment === booking._id && (
                      <div style={{ marginTop: '15px', padding: '15px', background: '#f9f9f9', borderRadius: '6px', border: '2px solid #667eea' }}>
                        <h4>💳 Create Payment Request</h4>
                        <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                          <div>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}>Amount (₹) *</label>
                            <input 
                              type="number" 
                              value={paymentRequestForm.amount}
                              onChange={(e) => setPaymentRequestForm({ ...paymentRequestForm, amount: e.target.value })}
                              placeholder="e.g., 5000"
                              min="1"
                              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}>Description</label>
                            <input 
                              type="text" 
                              value={paymentRequestForm.description}
                              onChange={(e) => setPaymentRequestForm({ ...paymentRequestForm, description: e.target.value })}
                              placeholder="e.g., Advance booking payment"
                              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}>Days until expiry</label>
                            <input 
                              type="number" 
                              value={paymentRequestForm.daysUntilExpiry}
                              onChange={(e) => setPaymentRequestForm({ ...paymentRequestForm, daysUntilExpiry: e.target.value })}
                              placeholder="7"
                              min="1"
                              max="30"
                              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCreatePaymentRequest(booking._id)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '1rem'
                          }}
                        >
                          ✅ Create Request
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Requests Tab */}
        {activeTab === 'payments' && (
          <div>
            <h2>💳 Payment Requests</h2>
            {paymentRequestsLoading ? (
              <p>Loading payment requests...</p>
            ) : paymentRequests.length === 0 ? (
              <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', color: '#666' }}>No pending payment requests</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {paymentRequests.map(booking => (
                  <div key={booking._id} style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                      <div>
                        <h3>{booking.venue?.name}</h3>
                        <p style={{ color: '#666', margin: '5px 0' }}>👤 {booking.customerName}</p>
                        <p style={{ color: '#666', margin: '5px 0' }}>📧 {booking.customerEmail}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#667eea', margin: '0' }}>
                          💰 ₹{booking.totalCost}
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#666', margin: '5px 0' }}>Total event cost</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <p><strong>📅 Event Date:</strong> {new Date(booking.eventDate).toDateString()}</p>
                      <p><strong>🎭 Event Type:</strong> {booking.eventType}</p>
                      <p><strong>👥 Guests:</strong> {booking.guestCount}</p>
                    </div>

                    {booking.paymentRequests && booking.paymentRequests.length > 0 && (
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e0e0e0' }}>
                        <h4>📋 Payment Requests ({booking.paymentRequests.length})</h4>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {booking.paymentRequests.map((pr, idx) => (
                            <div key={pr._id} style={{ background: '#f9f9f9', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <p style={{ margin: '0 0 5px 0', fontWeight: '600' }}>Request #{idx + 1}: ₹{pr.amount}</p>
                                  <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#666' }}>
                                    {pr.description}
                                  </p>
                                  <p style={{ margin: '0', fontSize: '0.85rem', color: '#999' }}>
                                    Expires: {new Date(pr.expiresAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span style={{ 
                                  padding: '6px 12px', 
                                  borderRadius: '20px', 
                                  fontWeight: '600',
                                  fontSize: '0.85rem',
                                  background: pr.status === 'paid' ? '#d4edda' : pr.status === 'expired' ? '#f8d7da' : '#fff3cd',
                                  color: pr.status === 'paid' ? '#155724' : pr.status === 'expired' ? '#721c24' : '#856404'
                                }}>
                                  {pr.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
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

export default VenueOwnerDashboard;
