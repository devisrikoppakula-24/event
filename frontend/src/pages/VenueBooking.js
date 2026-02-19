import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './VenueBooking.css';

function VenueBooking() {
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [venueBookings, setVenueBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [bookingId, setBookingId] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [searchFilters, setSearchFilters] = useState({
    location: '',
    minCapacity: '',
    maxPrice: '',
    eventDate: ''
  });

  const [bookingData, setBookingData] = useState({
    eventDate: '',
    eventStartTime: '',
    eventEndTime: '',
    eventType: '',
    guestCount: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: ''
  });

  const eventTypes = ['marriage', 'birthday', 'engagement', 'corporate', 'other'];

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // Fetch all venues on mount
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/venues/search?location=all');
        setVenues(response.data);
        setFilteredVenues(response.data);
      } catch (err) {
        console.error('Error fetching venues:', err);
      }
    };
    fetchVenues();
  }, []);

  // Handle search filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters({ ...searchFilters, [name]: value });
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = venues;

    if (searchFilters.location) {
      filtered = filtered.filter(v => 
        v.location.toLowerCase().includes(searchFilters.location.toLowerCase())
      );
    }

    if (searchFilters.minCapacity) {
      filtered = filtered.filter(v => v.capacity >= parseInt(searchFilters.minCapacity));
    }

    if (searchFilters.maxPrice) {
      filtered = filtered.filter(v => v.pricePerDay <= parseInt(searchFilters.maxPrice));
    }

    setFilteredVenues(filtered);
  };

  // Fetch venue bookings when venue is selected
  const fetchVenueBookings = async (venueId) => {
    try {
      // eslint-disable-next-line no-unused-vars
      const response = await axios.get(`http://localhost:5000/api/venues/search?location=all`);
      // eslint-disable-next-line no-unused-vars
      const currentBookings = await axios.post('http://localhost:5000/api/bookings/check-availability', {
        venueId: venueId,
        eventDate: new Date().toISOString().split('T')[0],
        eventStartTime: '00:00',
        eventEndTime: '23:59'
      });
      
      // Get bookings for this venue by querying all bookings
      setVenueBookings([]);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  // Fetch available services
  const fetchAvailableServices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/services/');
      setAvailableServices(response.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  // Get CSS class for calendar dates based on availability
  const getTileClassName = ({ date, view }) => {
    if (view === 'month' && selectedVenue) {
      const dateStr = date.toISOString().split('T')[0];
      const hasBooking = venueBookings.some(b => b.eventDate.split('T')[0] === dateStr);
      
      // Green for available dates, mark with dot for booked dates
      if (hasBooking) {
        return 'booked-date';
      } else if (date >= new Date()) {
        return 'available-date';
      }
    }
    return '';
  };

  // Get tile content for calendar
  const getTileContent = ({ date, view }) => {
    if (view === 'month' && selectedVenue) {
      const dateStr = date.toISOString().split('T')[0];
      const hasBooking = venueBookings.some(b => b.eventDate.split('T')[0] === dateStr);
      if (hasBooking) {
        return <div className="booking-dot">•</div>;
      }
    }
    return null;
  };

  // Toggle service selection
  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Calculate total booking cost
  const calculateTotalCost = () => {
    let total = 0;
    if (selectedVenue) {
      total += selectedVenue.pricePerDay;
    }
    
    selectedServices.forEach(serviceId => {
      const service = availableServices.find(s => s._id === serviceId);
      if (service) {
        total += service.pricing.fullEvent || service.pricing.hourly || 0;
      }
    });
    
    return total;
  };

  // Initiate Razorpay payment
  const handlePayment = async () => {
    if (!bookingId) {
      alert('Booking ID not found');
      return;
    }

    const totalAmount = calculateTotalCost();
    
    try {
      const response = await axios.post('http://localhost:5000/api/bookings/initiate-payment', {
        bookingId: bookingId,
        amount: totalAmount * 100, // Razorpay expects amount in paise
        currency: 'INR'
      });

      const { orderId, key } = response.data;

      const options = {
        key: key,
        amount: totalAmount * 100,
        currency: 'INR',
        name: 'Event Planning Platform',
        description: `Booking for ${selectedVenue.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyResponse = await axios.post(
              'http://localhost:5000/api/bookings/verify-payment',
              {
                bookingId: bookingId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              }
            );

            if (verifyResponse.data.success) {
              alert('✅ Payment successful! Your booking is confirmed.');
              setShowPaymentForm(false);
              setShowBookingForm(false);
              setSelectedServices([]);
              setBookingId(null);
            }
          } catch (err) {
            alert('Payment verification failed: ' + (err.response?.data?.message || err.message));
          }
        },
        prefill: {
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          contact: bookingData.customerPhone
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
    }
  };

  // Check availability
  const handleCheckAvailability = async () => {
    if (!bookingData.eventDate || !bookingData.eventStartTime || !bookingData.eventEndTime) {
      alert('Please fill date and time fields');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/bookings/check-availability', {
        venueId: selectedVenue._id,
        eventDate: bookingData.eventDate,
        eventStartTime: bookingData.eventStartTime,
        eventEndTime: bookingData.eventEndTime
      });

      setAvailabilityStatus(response.data);

      if (!response.data.available) {
        alert('⚠️ Time slot is not available. Please choose a different time.');
      } else {
        alert('✅ Time slot is available!');
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      alert('Error checking availability: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle booking data changes
  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData({ ...bookingData, [name]: value });
  };

  // Create booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('⚠️ Please login first to create a booking');
        setLoading(false);
        window.location.href = '/login';
        return;
      }

      // Validate required fields
      if (!bookingData.eventDate || !bookingData.eventStartTime || !bookingData.eventEndTime || 
          !bookingData.eventType || !bookingData.guestCount || !bookingData.customerName || 
          !bookingData.customerEmail || !bookingData.customerPhone) {
        alert('Please fill all required fields');
        setLoading(false);
        return;
      }

      if (parseInt(bookingData.guestCount) > selectedVenue.capacity) {
        alert(`Guest count exceeds venue capacity of ${selectedVenue.capacity}`);
        setLoading(false);
        return;
      }

      const response = await axios.post('http://localhost:5000/api/bookings/', {
        venueId: selectedVenue._id,
        eventDate: bookingData.eventDate,
        eventStartTime: bookingData.eventStartTime,
        eventEndTime: bookingData.eventEndTime,
        eventType: bookingData.eventType,
        guestCount: parseInt(bookingData.guestCount),
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        specialRequests: bookingData.specialRequests,
        services: selectedServices
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Booking created successfully, now show payment form
      setBookingId(response.data.booking._id);
      setShowPaymentForm(true);
      alert('✅ Booking created! Please proceed to payment.');
    } catch (err) {
      console.error('Error creating booking:', err);
      
      if (err.response?.status === 401) {
        alert('⚠️ Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert('Error creating booking: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="venue-booking">
        <h1>🎉 Book Your Perfect Venue</h1>

        {/* Search and Filters */}
        <div className="search-section">
          <h2>🔍 Search Venues</h2>
          <div className="search-filters">
            <div className="filter-group">
              <label>Location</label>
              <input 
                type="text"
                name="location"
                value={searchFilters.location}
                onChange={handleFilterChange}
                placeholder="e.g., Mumbai, Pune"
              />
            </div>

            <div className="filter-group">
              <label>Minimum Capacity</label>
              <input 
                type="number"
                name="minCapacity"
                value={searchFilters.minCapacity}
                onChange={handleFilterChange}
                placeholder="e.g., 100"
                min="0"
              />
            </div>

            <div className="filter-group">
              <label>Maximum Price (per day)</label>
              <input 
                type="number"
                name="maxPrice"
                value={searchFilters.maxPrice}
                onChange={handleFilterChange}
                placeholder="e.g., 50000"
                min="0"
              />
            </div>

            <div className="filter-group">
              <label>Event Date</label>
              <input 
                type="date"
                name="eventDate"
                value={searchFilters.eventDate}
                onChange={handleFilterChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <button className="btn-search" onClick={applyFilters}>
              🔍 Search
            </button>
          </div>

          <p className="search-result">
            Found {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} 
            {searchFilters.eventDate && ` available on ${new Date(searchFilters.eventDate).toDateString()}`}
          </p>
        </div>

        {/* Venues Grid */}
        <div className="venues-grid">
          {filteredVenues.length === 0 ? (
            <div className="no-results">
              <p>No venues found matching your criteria</p>
            </div>
          ) : (
            filteredVenues.map(venue => (
              <div key={venue._id} className="venue-card">
                {/* Venue Image */}
                <div className="venue-image">
                  {venue.images && venue.images.length > 0 ? (
                    <img src={venue.images[0]} alt={venue.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>

                {/* Venue Info */}
                <div className="venue-info">
                  <h3>{venue.name}</h3>
                  
                  <div className="info-item">
                    <span>📍</span>
                    <p>{venue.location}</p>
                  </div>

                  <div className="info-item">
                    <span>👥</span>
                    <p>{venue.capacity} people capacity</p>
                  </div>

                  <div className="info-item">
                    <span>💰</span>
                    <p>₹{venue.pricePerDay ? parseInt(venue.pricePerDay).toLocaleString() : '0'}/day</p>
                  </div>

                  {venue.description && (
                    <div className="info-item">
                      <span>📝</span>
                      <p>{venue.description.substring(0, 80)}...</p>
                    </div>
                  )}

                  {venue.facilities && venue.facilities.length > 0 && (
                    <div className="info-item">
                      <span>🏢</span>
                      <div className="tags">
                        {venue.facilities.slice(0, 3).map((f, i) => (
                          <span key={i} className="tag">{f}</span>
                        ))}
                        {venue.facilities.length > 3 && <span className="tag">+{venue.facilities.length - 3}</span>}
                      </div>
                    </div>
                  )}

                  <button 
                    className="btn-book"
                    onClick={() => {
                      if (!isLoggedIn) {
                        alert('⚠️ Please login first to book a venue');
                        window.location.href = '/login';
                        return;
                      }
                      setSelectedVenue(venue);
                      setShowBookingForm(true);
                      setAvailabilityStatus(null);
                      fetchVenueBookings(venue._id);
                      fetchAvailableServices();
                    }}
                  >
                    📅 Book Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && selectedVenue && (
          <div className="booking-modal">
            <div className="modal-content">
              <button className="close-btn" onClick={() => setShowBookingForm(false)}>✕</button>
              
              <h2>📅 Book {selectedVenue.name}</h2>

              <div className="booking-details">
                <p><strong>Venue:</strong> {selectedVenue.name}</p>
                <p><strong>Location:</strong> {selectedVenue.location}</p>
                <p><strong>Capacity:</strong> {selectedVenue.capacity} people</p>
                <p><strong>Price:</strong> ₹{selectedVenue.pricePerDay ? parseInt(selectedVenue.pricePerDay).toLocaleString() : '0'}/day</p>
              </div>

              <form onSubmit={handleCreateBooking} className="booking-form">
                
                {/* Date & Time Section */}
                <div className="form-section">
                  <h3>📅 Event Date & Time</h3>
                  
                  <div className="form-group">
                    <label>Event Date *</label>
                    <input 
                      type="date"
                      name="eventDate"
                      value={bookingData.eventDate}
                      onChange={handleBookingChange}
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Calendar for Availability */}
                  <div className="availability-calendar">
                    <h4>📅 Venue Availability Calendar</h4>
                    <div className="calendar-legend">
                      <span className="legend-item available">🟩 Available</span>
                      <span className="legend-item booked">⭕ Booked</span>
                    </div>
                    <Calendar 
                      value={selectedDate}
                      onChange={setSelectedDate}
                      tileClassName={getTileClassName}
                      tileContent={getTileContent}
                      minDate={new Date()}
                    />
                    <p className="calendar-info">Click on a date to select it for booking</p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Time *</label>
                      <input 
                        type="time"
                        name="eventStartTime"
                        value={bookingData.eventStartTime}
                        onChange={handleBookingChange}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>End Time *</label>
                      <input 
                        type="time"
                        name="eventEndTime"
                        value={bookingData.eventEndTime}
                        onChange={handleBookingChange}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="button"
                    className="btn-check-availability"
                    onClick={handleCheckAvailability}
                    disabled={loading || !bookingData.eventDate || !bookingData.eventStartTime || !bookingData.eventEndTime}
                  >
                    ⚡ Check Availability
                  </button>

                  {availabilityStatus && (
                    <div className={`availability-status ${availabilityStatus.available ? 'available' : 'unavailable'}`}>
                      {availabilityStatus.available ? (
                        <>
                          <p>✅ Time slot is available!</p>
                        </>
                      ) : (
                        <>
                          <p>❌ Time slot is not available</p>
                          <p>Conflicting bookings: {availabilityStatus.conflictingBookings}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Event Details Section */}
                <div className="form-section">
                  <h3>🎉 Event Details</h3>
                  
                  <div className="form-group">
                    <label>Event Type *</label>
                    <select 
                      name="eventType"
                      value={bookingData.eventType}
                      onChange={handleBookingChange}
                      disabled={loading}
                      required
                    >
                      <option value="">Select Event Type</option>
                      {eventTypes.map(type => (
                        <option key={type} value={type}>
                          {type.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Number of Guests *</label>
                    <input 
                      type="number"
                      name="guestCount"
                      value={bookingData.guestCount}
                      onChange={handleBookingChange}
                      placeholder="e.g., 100"
                      disabled={loading}
                      min="1"
                      max={selectedVenue.capacity}
                      required
                    />
                    <small>Maximum: {selectedVenue.capacity} people</small>
                  </div>

                  <div className="form-group">
                    <label>Special Requests</label>
                    <textarea 
                      name="specialRequests"
                      value={bookingData.specialRequests}
                      onChange={handleBookingChange}
                      placeholder="Any special requirements..."
                      disabled={loading}
                      rows="3"
                    />
                  </div>
                </div>

                {/* Services Section */}
                <div className="form-section">
                  <h3>🎁 Add Services (Optional)</h3>
                  <p style={{ color: '#666', marginBottom: '15px' }}>Select additional services to enhance your event:</p>
                  
                  <div className="services-grid-booking">
                    {availableServices && availableServices.length > 0 ? (
                      availableServices.map(service => (
                        <div key={service._id} className="service-checkbox-item">
                          <label className="service-checkbox-label">
                            <input 
                              type="checkbox"
                              checked={selectedServices.includes(service._id)}
                              onChange={() => handleServiceToggle(service._id)}
                              disabled={loading}
                            />
                            <div className="service-checkbox-content">
                              <span className="service-name">{service.name}</span>
                              <span className="service-type">({service.type})</span>
                              <span className="service-price">₹{service.pricing.fullEvent || service.pricing.hourly}</span>
                            </div>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#999' }}>No services available</p>
                    )}
                  </div>
                </div>

                {/* Customer Details Section */}
                <div className="form-section">
                  <h3>👤 Your Details</h3>
                  
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text"
                      name="customerName"
                      value={bookingData.customerName}
                      onChange={handleBookingChange}
                      placeholder="Your full name"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input 
                      type="email"
                      name="customerEmail"
                      value={bookingData.customerEmail}
                      onChange={handleBookingChange}
                      placeholder="your@email.com"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input 
                      type="tel"
                      name="customerPhone"
                      value={bookingData.customerPhone}
                      onChange={handleBookingChange}
                      placeholder="9876543210"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="cost-summary">
                  <h3>💰 Booking Summary</h3>
                  <p>Venue Price: ₹{selectedVenue.pricePerDay ? parseInt(selectedVenue.pricePerDay).toLocaleString() : '0'}/day</p>
                  
                  {selectedServices.length > 0 && (
                    <div className="services-cost">
                      <p style={{ fontWeight: 'bold', marginTop: '10px' }}>Services:</p>
                      {selectedServices.map(serviceId => {
                        const service = availableServices.find(s => s._id === serviceId);
                        return service ? (
                          <p key={serviceId} style={{ paddingLeft: '10px' }}>
                            • {service.name}: ₹{(service.pricing.fullEvent || service.pricing.hourly).toLocaleString()}
                          </p>
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  <p className="total">Total: ₹{calculateTotalCost().toLocaleString()}</p>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                  <button 
                    type="submit"
                    className="btn-submit"
                    disabled={loading || !availabilityStatus?.available}
                  >
                    {loading ? '⏳ Booking...' : '✅ Confirm Booking'}
                  </button>
                  <button 
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowBookingForm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentForm && bookingId && (
          <div className="modal-overlay">
            <div className="modal-content payment-modal">
              <button 
                className="modal-close"
                onClick={() => setShowPaymentForm(false)}
              >
                ✕
              </button>

              <h2>💳 Complete Payment</h2>
              
              <div className="payment-summary">
                <h3>Order Summary</h3>
                <div className="summary-item">
                  <span>Venue ({selectedVenue?.name}):</span>
                  <span>₹{selectedVenue?.pricePerDay ? parseInt(selectedVenue.pricePerDay).toLocaleString() : '0'}</span>
                </div>

                {selectedServices.length > 0 && (
                  <div className="services-list">
                    {selectedServices.map(serviceId => {
                      const service = availableServices.find(s => s._id === serviceId);
                      return service ? (
                        <div key={serviceId} className="summary-item">
                          <span>{service.name}:</span>
                          <span>₹{(service.pricing.fullEvent || service.pricing.hourly).toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="summary-item total">
                  <span>Total Amount:</span>
                  <span>₹{calculateTotalCost().toLocaleString()}</span>
                </div>
              </div>

              <div className="payment-info">
                <p><strong>Name:</strong> {bookingData.customerName}</p>
                <p><strong>Email:</strong> {bookingData.customerEmail}</p>
                <p><strong>Phone:</strong> {bookingData.customerPhone}</p>
              </div>

              <div className="payment-actions">
                <button 
                  className="btn-pay"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  💳 Proceed to Payment (Razorpay)
                </button>
                <button 
                  className="btn-cancel-payment"
                  onClick={() => setShowPaymentForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VenueBooking;
