import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CustomerDashboard.css';

function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/bookings/user/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  // Fetch payment requests
  const fetchPaymentRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/bookings/user/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter bookings with pending payment requests
      const filteredBookings = response.data.filter(booking => 
        booking.paymentRequests && booking.paymentRequests.some(pr => pr.status === 'pending')
      );
      setPaymentRequests(filteredBookings);
    } catch (err) {
      console.error('Error fetching payment requests:', err);
    }
  };

  // Fetch available services
  const fetchAvailableServices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/services/');
      setAvailableServices(response.data);
      setFilteredServices(response.data);
    } catch (err) {
      console.error('Error fetching services:', err);
      setAvailableServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter services based on location, date, and type
  const applyServiceFilters = useCallback(() => {
    let filtered = availableServices;

    // Filter by service type
    if (selectedServiceType) {
      filtered = filtered.filter(s => s.type === selectedServiceType);
    }

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(s => 
        s.serviceLocations && s.serviceLocations.some(loc => 
          loc.toLowerCase().includes(selectedLocation.toLowerCase())
        )
      );
    }

    // Filter by date availability (check if service is available on selected date)
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const dayOfWeek = selectedDateObj.getDay();
      
      filtered = filtered.filter(s => 
        s.availability && (!s.availability.daysOfWeek || s.availability.daysOfWeek.includes(dayOfWeek))
      );
    }

    setFilteredServices(filtered);
  }, [selectedDate, selectedLocation, selectedServiceType, availableServices]);

  // Handle payment requests
  const handlePaymentRequest = async (bookingId, paymentRequestId, amount) => {
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Step 1: Initiate payment (get Razorpay order)
      const initiateResponse = await axios.post(
        'http://localhost:5000/api/bookings/initiate-payment',
        {
          bookingId,
          amount: amount * 100, // Convert to paise
          currency: 'INR'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { orderId, key } = initiateResponse.data;

      // Step 2: Open Razorpay payment modal
      const options = {
        key: key,
        amount: amount * 100,
        currency: 'INR',
        order_id: orderId,
        name: 'Event Booking Payment',
        description: 'Payment Request for Event Booking',
        handler: async (response) => {
          try {
            // Step 3: Verify payment on backend
            const verifyResponse = await axios.post(
              `http://localhost:5000/api/bookings/${bookingId}/payment-request/verify`,
              {
                paymentRequestId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            if (verifyResponse.data.success) {
              alert('✅ Payment successful! Thank you for your payment.');
              fetchPaymentRequests();
              fetchBookings();
            }
          } catch (err) {
            alert('Payment verification failed: ' + (err.response?.data?.message || err.message));
          }
        },
        prefill: {
          name: bookings.find(b => b._id === bookingId)?.customerName || 'Event Customer',
          email: bookings.find(b => b._id === bookingId)?.customerEmail || '',
          contact: bookings.find(b => b._id === bookingId)?.customerPhone || ''
        },
        theme: {
          color: '#667eea'
        }
      };

      const RazorpayWindow = (window).Razorpay;
      const rzp = new RazorpayWindow(options);
      rzp.open();
    } catch (err) {
      alert('Error initiating payment: ' + (err.response?.data?.message || err.message));
    } finally {
      setPaymentLoading(false);
    }
  };

  // Setup effects
  useEffect(() => {
    fetchBookings();
    fetchPaymentRequests();
    if (activeTab === 'services') {
      fetchAvailableServices();
    }
  }, [activeTab]);

  // Apply filters when any filter changes
  useEffect(() => {
    applyServiceFilters();
  }, [applyServiceFilters]);

  return (
    <div className="container">
      <div style={{ marginBottom: '30px' }}>
        <h1>🎉 Welcome, Customer!</h1>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'bookings' ? '#667eea' : '#e0e0e0',
              color: activeTab === 'bookings' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📅 My Bookings
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'payments' ? '#667eea' : '#e0e0e0',
              color: activeTab === 'payments' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            💳 Payment Requests {paymentRequests.flat().reduce((acc, b) => acc + (b.paymentRequests?.filter(pr => pr.status === 'pending').length || 0), 0) > 0 && <span style={{ marginLeft: '5px', background: '#ff6b6b', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{paymentRequests.flat().reduce((acc, b) => acc + (b.paymentRequests?.filter(pr => pr.status === 'pending').length || 0), 0)}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'services' ? '#667eea' : '#e0e0e0',
              color: activeTab === 'services' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🎯 Browse Services
          </button>
          <Link 
            to="/book-venue"
            style={{
              padding: '12px 24px',
              background: '#764ba2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            ➕ New Booking
          </Link>
        </div>
      </div>

      {activeTab === 'bookings' && (
        <div style={{ marginTop: '30px' }}>
          <h2>My Bookings</h2>
          {bookings.length === 0 ? (
            <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: '#666' }}>No bookings yet</p>
              <Link to="/book-venue" style={{ color: '#667eea', textDecoration: 'underline' }}>Create your first booking</Link>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking._id} style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>{booking.venue?.name || 'Venue'}</h3>
                    <p><strong>📅 Date:</strong> {new Date(booking.eventDate).toDateString()}</p>
                    <p><strong>⏰ Time:</strong> {booking.eventStartTime} - {booking.eventEndTime}</p>
                    <p><strong>🎭 Type:</strong> {booking.eventType}</p>
                    <p><strong>👥 Guests:</strong> {booking.guestCount}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>₹{booking.totalCost}</p>
                    <p><strong>Status:</strong> <span style={{ padding: '4px 8px', borderRadius: '4px', background: booking.status === 'confirmed' ? '#e8f5e9' : booking.status === 'cancelled' ? '#ffebee' : '#fff3e0', color: booking.status === 'confirmed' ? '#2e7d32' : booking.status === 'cancelled' ? '#c62828' : '#e65100' }}>{booking.status.toUpperCase()}</span></p>
                    <p><strong>Payment:</strong> <span style={{ color: booking.paymentStatus === 'completed' ? 'green' : 'orange' }}>{booking.paymentStatus || 'Pending'}</span></p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div style={{ marginTop: '30px' }}>
          <h2>💳 Payment Requests Due</h2>
          {paymentRequests.length === 0 ? (
            <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: '#666' }}>No pending payment requests</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {paymentRequests.map(booking => (
                <div key={booking._id} style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #ffb347' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <h3>{booking.venue?.name || 'Venue'}</h3>
                      <p><strong>📅 Event Date:</strong> {new Date(booking.eventDate).toDateString()}</p>
                      <p><strong>⏰ Time:</strong> {booking.eventStartTime} - {booking.eventEndTime}</p>
                      <p><strong>🎭 Event Type:</strong> {booking.eventType}</p>
                      <p><strong>👥 Guests:</strong> {booking.guestCount}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#666' }}>Total Booking Cost</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea', margin: '0' }}>₹{booking.totalCost}</p>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '20px', marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#ff6b6b' }}>⚠️ Pending Payment Requests ({booking.paymentRequests?.filter(pr => pr.status === 'pending').length || 0})</h4>
                    {booking.paymentRequests?.filter(pr => pr.status === 'pending').map((pr, idx) => (
                      <div key={pr._id} style={{ background: '#fff9e6', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #ffe0b2' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '15px', marginBottom: '15px' }}>
                          <div>
                            <p style={{ margin: '0 0 5px 0', fontWeight: '600', fontSize: '1.1rem', color: '#333' }}>
                              Payment Request #{idx + 1}
                            </p>
                            <p style={{ margin: '0 0 3px 0', fontSize: '0.9rem', color: '#666' }}>
                              {pr.description}
                            </p>
                            <p style={{ margin: '0', fontSize: '0.85rem', color: '#999' }}>
                              ⏰ Expires: {new Date(pr.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ff6b6b', margin: '0 0 10px 0' }}>
                              ₹{pr.amount}
                            </p>
                            <button
                              onClick={() => handlePaymentRequest(booking._id, pr._id, pr.amount)}
                              disabled={paymentLoading}
                              style={{
                                padding: '10px 20px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                opacity: paymentLoading ? 0.6 : 1
                              }}
                            >
                              {paymentLoading ? '⏳ Processing...' : '💳 Pay Now'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'services' && (
        <div style={{ marginTop: '30px' }}>
          <h2>🎯 Available Services for Your Events</h2>
          
          {/* Filter Section */}
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: '12px',
            color: 'white'
          }}>
            <p style={{ margin: '0 0 15px 0', fontWeight: '600', fontSize: '1.1rem' }}>🔍 Filter Services</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {/* Service Type Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Service Type:</label>
                <select 
                  value={selectedServiceType} 
                  onChange={(e) => setSelectedServiceType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">All Services</option>
                  <option value="catering">🍽️ Catering</option>
                  <option value="photography">📸 Photography</option>
                  <option value="decoration">✨ Decoration</option>
                  <option value="guest_handler">👥 Guest Handler</option>
                  <option value="makeup">💄 Makeup</option>
                  <option value="music">🎵 Music</option>
                  <option value="event_manager">📋 Event Manager</option>
                  <option value="cultural">🎭 Cultural</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Location:</label>
                <input 
                  type="text" 
                  placeholder="e.g., Delhi, Mumbai..." 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Date Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Event Date:</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            {(selectedServiceType || selectedLocation || selectedDate) && (
              <button
                onClick={() => {
                  setSelectedServiceType('');
                  setSelectedLocation('');
                  setSelectedDate('');
                }}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  border: '1px solid white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
                }}
              >
                ✕ Clear Filters
              </button>
            )}
            <p style={{ margin: '12px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
              📌 Showing {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.1rem', color: '#666' }}>
              ⏳ Loading services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div style={{ 
              background: '#f5f5f5', 
              padding: '40px', 
              borderRadius: '8px', 
              textAlign: 'center',
              color: '#666'
            }}>
              <p style={{ fontSize: '1.1rem', margin: '0 0 10px 0' }}>😔 No services match your filters</p>
              <p style={{ fontSize: '0.95rem', margin: 0 }}>Try adjusting your search criteria</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {filteredServices.map(service => (
                <div 
                  key={service._id} 
                  style={{ 
                    background: 'white', 
                    padding: '20px', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e0e0e0',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Service Header */}
                  <div style={{ marginBottom: '15px' }}>
                    <h3 style={{ color: '#667eea', margin: '0 0 5px 0', fontSize: '1.2rem' }}>
                      {service.name}
                    </h3>
                    <p style={{ 
                      color: '#999', 
                      fontSize: '0.85rem', 
                      margin: '0',
                      display: 'inline-block',
                      background: '#f0f0f0',
                      padding: '4px 10px',
                      borderRadius: '12px'
                    }}>
                      {service.type?.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>

                  {/* Description */}
                  <p style={{ 
                    color: '#666', 
                    fontSize: '0.95rem',
                    margin: '10px 0',
                    flex: 1
                  }}>
                    {service.description || 'Professional service provider'}
                  </p>

                  {/* Rating */}
                  <div style={{ margin: '12px 0', padding: '10px', background: '#f9f9f9', borderRadius: '6px' }}>
                    <p style={{ margin: '0', fontSize: '0.9rem' }}>
                      <strong>⭐ Rating:</strong> {service.ratings || 'Not rated'} / 5
                    </p>
                  </div>

                  {/* Pricing */}
                  <div style={{ margin: '12px 0', padding: '10px', background: '#f0f8ff', borderRadius: '6px' }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: '600', fontSize: '0.9rem' }}>💰 Pricing:</p>
                    <div style={{ fontSize: '0.85rem', color: '#555' }}>
                      {service.pricing?.hourly > 0 && (
                        <p style={{ margin: '3px 0' }}>⏱️ ₹{service.pricing.hourly}/hour</p>
                      )}
                      {service.pricing?.fullEvent > 0 && (
                        <p style={{ margin: '3px 0' }}>🎪 ₹{service.pricing.fullEvent}/full event</p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <p style={{ fontSize: '0.9rem', color: '#666', margin: '10px 0' }}>
                    <strong>📍 Available Locations:</strong>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {service.serviceLocations && service.serviceLocations.length > 0 ? (
                      service.serviceLocations.map((loc, idx) => (
                        <span 
                          key={idx}
                          style={{
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}
                        >
                          {loc}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#999' }}>Not specified</span>
                    )}
                  </div>

                  {/* Provider Info */}
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: '10px 0' }}>
                    <strong>👤 Provider:</strong> {service.provider?.name || 'Professional Provider'}
                  </p>

                  {/* Contact */}
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: '10px 0' }}>
                    <strong>📞 Contact:</strong> {service.contactNumber || 'N/A'}
                  </p>

                  {/* Availability */}
                  {service.availability && (
                    <div style={{ fontSize: '0.8rem', color: '#666', margin: '10px 0', padding: '8px', background: '#fffbf0', borderRadius: '4px' }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: '600' }}>⏰ Availability:</p>
                      {service.availability.startTime && service.availability.endTime && (
                        <p style={{ margin: '0' }}>{service.availability.startTime} - {service.availability.endTime}</p>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Link 
                    to="/book-venue"
                    style={{
                      marginTop: '15px',
                      display: 'block',
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      textAlign: 'center',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      fontSize: '0.95rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ➕ Add to Booking
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
