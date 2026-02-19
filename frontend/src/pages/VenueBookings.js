import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VenueBookings.css';

const VenueBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bookings/owner/venue-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
      setFilteredBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      alert('Error loading bookings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings
  useEffect(() => {
    let filtered = bookings;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerPhone.includes(searchTerm) ||
        b.venue?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  }, [selectedStatus, searchTerm, bookings]);

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/bookings/owner/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Booking status updated successfully!');
      fetchBookings();
    } catch (err) {
      alert('Error updating booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const getEventTypeEmoji = (eventType) => {
    const emojis = {
      marriage: '💒',
      birthday: '🎂',
      engagement: '💍',
      corporate: '🏢',
      other: '🎉'
    };
    return emojis[eventType] || '🎉';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="venue-bookings-container">
      <div className="bookings-header">
        <h1>📋 Venue Bookings</h1>
        <p>Manage all bookings for your venues</p>
      </div>

      {/* Stats Cards */}
      <div className="bookings-stats">
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-content">
            <p className="stat-label">Total Bookings</p>
            <p className="stat-value">{bookings.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <p className="stat-label">Confirmed</p>
            <p className="stat-value">{bookings.filter(b => b.status === 'confirmed').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-content">
            <p className="stat-label">Pending</p>
            <p className="stat-value">{bookings.filter(b => b.status === 'pending').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✔️</span>
          <div className="stat-content">
            <p className="stat-label">Completed</p>
            <p className="stat-value">{bookings.filter(b => b.status === 'completed').length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bookings-filters">
        <div className="filter-search">
          <input
            type="text"
            placeholder="Search by name, email, phone, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-status">
          <button
            className={`status-filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            All
          </button>
          <button
            className={`status-filter-btn ${selectedStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('pending')}
          >
            Pending
          </button>
          <button
            className={`status-filter-btn ${selectedStatus === 'confirmed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('confirmed')}
          >
            Confirmed
          </button>
          <button
            className={`status-filter-btn ${selectedStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('completed')}
          >
            Completed
          </button>
          <button
            className={`status-filter-btn ${selectedStatus === 'cancelled' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="loading">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="no-bookings">
          <p>📭 No bookings found</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map(booking => (
            <div key={booking._id} className="booking-card">
              {/* Top Section - Venue & Status */}
              <div className="booking-header">
                <div className="booking-venue-info">
                  <h3>{booking.venue?.name || 'Venue'}</h3>
                  <p className="venue-location">{booking.venue?.location || 'Location'}</p>
                </div>
                <span className={`status-badge ${getStatusBadgeColor(booking.status)}`}>
                  {booking.status.toUpperCase()}
                </span>
              </div>

              {/* Event Details */}
              <div className="event-details">
                <div className="detail-item">
                  <span className="detail-label">📅 Date & Time</span>
                  <p>
                    {formatDate(booking.eventDate)} • {booking.eventStartTime} - {booking.eventEndTime}
                  </p>
                </div>

                <div className="detail-item">
                  <span className="detail-label">{getEventTypeEmoji(booking.eventType)} Event Type</span>
                  <p>{booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1)}</p>
                </div>

                <div className="detail-item">
                  <span className="detail-label">👥 Guests</span>
                  <p>{booking.guestCount} guests</p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="customer-details-section">
                <h4>👤 Customer Details</h4>
                <div className="customer-info-grid">
                  <div className="customer-info-item">
                    <span className="info-label">Name</span>
                    <p className="info-value">{booking.customerName}</p>
                  </div>
                  <div className="customer-info-item">
                    <span className="info-label">Email</span>
                    <p className="info-value">{booking.customerEmail}</p>
                  </div>
                  <div className="customer-info-item">
                    <span className="info-label">Phone</span>
                    <p className="info-value">{booking.customerPhone}</p>
                  </div>
                  <div className="customer-info-item">
                    <span className="info-label">Booking Date</span>
                    <p className="info-value">{formatDate(booking.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {booking.specialRequests && (
                <div className="special-requests-section">
                  <h4>📝 Special Requests</h4>
                  <p>{booking.specialRequests}</p>
                </div>
              )}

              {/* Services */}
              {booking.services && booking.services.length > 0 && (
                <div className="services-section">
                  <h4>🎁 Additional Services</h4>
                  <div className="services-list">
                    {booking.services.map((service, idx) => (
                      <span key={idx} className="service-tag">
                        {service.name || service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost & Payment */}
              <div className="cost-section">
                <div className="cost-item">
                  <span>💰 Total Amount</span>
                  <strong>₹{booking.totalAmount?.toLocaleString() || 'N/A'}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="booking-actions">
                {booking.status === 'pending' && (
                  <>
                    <button
                      className="btn-confirm"
                      onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                    >
                      ✅ Confirm
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                    >
                      ❌ Cancel
                    </button>
                  </>
                )}

                {booking.status === 'confirmed' && (
                  <button
                    className="btn-complete"
                    onClick={() => updateBookingStatus(booking._id, 'completed')}
                  >
                    ✔️ Mark Complete
                  </button>
                )}

                {booking.status === 'completed' && (
                  <p className="booking-completed">✅ This booking is completed</p>
                )}

                {booking.status === 'cancelled' && (
                  <p className="booking-cancelled">❌ This booking is cancelled</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueBookings;
