import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VenueOwnerBookings.css';

const VenueOwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, confirmed, pending, completed, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const statusColors = {
    pending: '#ff9800',
    confirmed: '#4CAF50',
    completed: '#2196F3',
    cancelled: '#f44336'
  };

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bookings/venue-owner/my-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      alert('Error fetching bookings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    if (filter === 'all') return bookings;
    return bookings.filter(b => b.status === filter);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    if (!window.confirm(`Mark this booking as ${newStatus}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Booking marked as ${newStatus}`);
      fetchBookings();
    } catch (err) {
      alert('Error updating booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="container">
        <div className="booking-management">
          <h1>📊 My Bookings</h1>
          <div className="loading">Loading bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="booking-management">
        <div className="header-section">
          <h1>📊 My Venue Bookings ({filteredBookings.length})</h1>
          <button className="btn-refresh" onClick={fetchBookings}>
            🔄 Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${bookings.length})`}
              {status !== 'all' && ` (${bookings.filter(b => b.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings found</p>
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map(booking => (
              <div key={booking._id} className="booking-card">
                <div className="booking-header">
                  <div className="booking-info-main">
                    <h3>{booking.venue?.name}</h3>
                    <p className="booking-date">
                      📅 {formatDate(booking.eventDate)} • {booking.eventStartTime} - {booking.eventEndTime}
                    </p>
                  </div>
                  <div className={`status-badge status-${booking.status}`}>
                    {booking.status.toUpperCase()}
                  </div>
                </div>

                <div className="booking-details-grid">
                  {/* Guest Information */}
                  <div className="detail-section">
                    <h4>👤 Guest Information</h4>
                    <p><strong>Name:</strong> {booking.customerName}</p>
                    <p><strong>Email:</strong> {booking.customerEmail}</p>
                    <p><strong>Phone:</strong> {booking.customerPhone}</p>
                  </div>

                  {/* Event Details */}
                  <div className="detail-section">
                    <h4>🎉 Event Details</h4>
                    <p><strong>Event Type:</strong> {booking.eventType.toUpperCase()}</p>
                    <p><strong>Guest Count:</strong> {booking.guestCount}</p>
                    <p><strong>Venue Capacity:</strong> {booking.venue?.capacity}</p>
                  </div>

                  {/* Venue Details */}
                  <div className="detail-section">
                    <h4>🏢 Venue</h4>
                    <p><strong>Location:</strong> {booking.venue?.location}</p>
                    <p><strong>Price/Day:</strong> ₹{booking.venue?.pricePerDay?.toLocaleString()}</p>
                  </div>

                  {/* Services */}
                  {booking.services && booking.services.length > 0 && (
                    <div className="detail-section services-section">
                      <h4>🎁 Services Booked</h4>
                      {booking.services.map((service, idx) => (
                        <p key={idx}>
                          • {service.name} <span className="service-type">({service.type})</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Special Requests */}
                  {booking.specialRequests && (
                    <div className="detail-section full-width">
                      <h4>✍️ Special Requests</h4>
                      <p>{booking.specialRequests}</p>
                    </div>
                  )}

                  {/* Payment Status */}
                  <div className="detail-section">
                    <h4>💳 Payment Status</h4>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`payment-status ${booking.paymentStatus}`}>
                        {booking.paymentStatus === 'completed' ? '✅ Completed' : '⏳ Pending'}
                      </span>
                    </p>
                    {booking.razorpayPaymentId && (
                      <p><strong>Payment ID:</strong> {booking.razorpayPaymentId.substring(0, 15)}...</p>
                    )}
                  </div>

                  {/* Booking Created */}
                  <div className="detail-section">
                    <h4>📝 Booking Info</h4>
                    <p><strong>Booked On:</strong> {formatDate(booking.createdAt)}</p>
                    <p><strong>Booking ID:</strong> {booking._id.substring(0, 8)}...</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="booking-actions">
                  <button
                    className="btn-status"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowDetails(true);
                    }}
                  >
                    👁️ View Full Details
                  </button>

                  {booking.status === 'pending' && (
                    <>
                      <button
                        className="btn-confirm"
                        onClick={() => handleStatusChange(booking._id, 'confirmed')}
                      >
                        ✅ Confirm Booking
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => handleStatusChange(booking._id, 'cancelled')}
                      >
                        ❌ Cancel Booking
                      </button>
                    </>
                  )}

                  {booking.status === 'confirmed' && (
                    <>
                      <button
                        className="btn-complete"
                        onClick={() => handleStatusChange(booking._id, 'completed')}
                      >
                        ✔️ Mark Complete
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => handleStatusChange(booking._id, 'cancelled')}
                      >
                        ❌ Cancel Booking
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Details Modal */}
        {showDetails && selectedBooking && (
          <div className="modal-overlay" onClick={() => setShowDetails(false)}>
            <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowDetails(false)}>✕</button>
              
              <h2>📋 Complete Booking Details</h2>
              
              <div className="full-details">
                <div className="detail-box">
                  <h3>Venue Information</h3>
                  <p><strong>Name:</strong> {selectedBooking.venue?.name}</p>
                  <p><strong>Location:</strong> {selectedBooking.venue?.location}</p>
                  <p><strong>Capacity:</strong> {selectedBooking.venue?.capacity} guests</p>
                  <p><strong>Price:</strong> ₹{selectedBooking.venue?.pricePerDay?.toLocaleString()}/day</p>
                </div>

                <div className="detail-box">
                  <h3>Event Information</h3>
                  <p><strong>Date:</strong> {formatDate(selectedBooking.eventDate)}</p>
                  <p><strong>Time:</strong> {selectedBooking.eventStartTime} - {selectedBooking.eventEndTime}</p>
                  <p><strong>Type:</strong> {selectedBooking.eventType.toUpperCase()}</p>
                  <p><strong>Guests:</strong> {selectedBooking.guestCount}</p>
                </div>

                <div className="detail-box">
                  <h3>Customer Information</h3>
                  <p><strong>Name:</strong> {selectedBooking.customerName}</p>
                  <p><strong>Email:</strong> {selectedBooking.customerEmail}</p>
                  <p><strong>Phone:</strong> {selectedBooking.customerPhone}</p>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="detail-box">
                    <h3>Special Requests</h3>
                    <p>{selectedBooking.specialRequests}</p>
                  </div>
                )}

                {selectedBooking.services && selectedBooking.services.length > 0 && (
                  <div className="detail-box">
                    <h3>Additional Services</h3>
                    {selectedBooking.services.map((service, idx) => (
                      <p key={idx}>• {service.name} ({service.type})</p>
                    ))}
                  </div>
                )}

                <div className="detail-box">
                  <h3>Booking Status</h3>
                  <p><strong>Status:</strong> {selectedBooking.status.toUpperCase()}</p>
                  <p><strong>Payment:</strong> {selectedBooking.paymentStatus === 'completed' ? '✅ Paid' : '⏳ Pending'}</p>
                  <p><strong>Created:</strong> {formatDate(selectedBooking.createdAt)}</p>
                  <p><strong>Booking ID:</strong> {selectedBooking._id}</p>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-close" onClick={() => setShowDetails(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueOwnerBookings;
