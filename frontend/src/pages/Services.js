import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Services.css';

function Services() {
  const [serviceType, setServiceType] = useState('catering');
  const [allServices, setAllServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableLocations, setAvailableLocations] = useState(new Set());

  // Auto-load services on component mount and when service type changes
  useEffect(() => {
    handleSearchServices(serviceType);
  }, [serviceType]);

  // Auto-apply filters when location or date changes
  useEffect(() => {
    applyFilters();
  }, [selectedLocation, selectedDate]);

  const handleSearchServices = async (type) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/services/type/${type}`);
      setAllServices(response.data);
      
      // Extract unique locations from all services
      const locations = new Set();
      response.data.forEach(service => {
        if (service.serviceLocations && Array.isArray(service.serviceLocations)) {
          service.serviceLocations.forEach(loc => locations.add(loc));
        }
      });
      setAvailableLocations(locations);
      
      console.log(`✅ Loaded ${response.data.length} ${type} services from ${locations.size} locations`);
      applyFilters();
    } catch (err) {
      console.error('Error fetching services:', err);
      setAllServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = allServices;

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(service => {
        if (!service.serviceLocations) return false;
        return service.serviceLocations.some(loc => 
          loc.toLowerCase().includes(selectedLocation.toLowerCase())
        );
      });
    }

    // Filter by date availability
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const dayOfWeek = selectedDateObj.getDay(); // 0-6 (Sunday-Saturday)

      filtered = filtered.filter(service => {
        if (!service.availability || !service.availability.daysOfWeek) return true;
        return service.availability.daysOfWeek.includes(dayOfWeek);
      });
    }

    setFilteredServices(filtered);
  }, [allServices, selectedLocation, selectedDate]);

  const handleSelectService = (serviceId) => {
    setSelectedServices([...selectedServices, serviceId]);
  };

  return (
    <div className="container">
      <div className="services-page">
        <h1>🎯 Add Services to Your Event</h1>
        
        {/* Service Type and Filter Section */}
        <div className="filter-section">
          <div className="service-type-selector">
            <label>Select Service Type:</label>
            <div className="service-type-options">
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                <option value="catering">🍽️ Catering</option>
                <option value="cultural">🎭 Culturals / Dance Teams</option>
                <option value="event_manager">📋 Event Managers</option>
                <option value="decoration">✨ Decorations</option>
                <option value="priest">🙏 Priests</option>
                <option value="makeup">💄 Makeup Artists</option>
              </select>
              <button onClick={() => handleSearchServices(serviceType)} className="add-service-btn" style={{ marginTop: 0, width: 'auto' }} disabled={loading}>
                {loading ? '⏳ Loading...' : '🔍 Search'}
              </button>
            </div>
          </div>

          {/* Location and Date Filters */}
          <div className="filter-box">
            <div className="filter-group">
              <label>📍 Location:</label>
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                <option value="">🌍 All Locations</option>
                {Array.from(availableLocations).sort().map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>📅 Event Date:</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {(selectedLocation || selectedDate) && (
              <div className="filter-group">
                <button 
                  className="clear-filters-btn"
                  onClick={() => {
                    setSelectedLocation('');
                    setSelectedDate('');
                  }}
                >
                  ✕ Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>
            Found <strong>{filteredServices.length}</strong> matching service{filteredServices.length !== 1 ? 's' : ''}
            {selectedLocation && ` in ${selectedLocation}`}
            {selectedDate && ` available on ${new Date(selectedDate).toLocaleDateString()}`}
          </p>
        </div>

        <div className="services-grid">
          {filteredServices.map(service => (
            <div key={service._id} className="service-card">
              <h3>{service.name}</h3>
              <p className="service-type-tag">📁 {service.type?.replace('_', ' ').toUpperCase()}</p>
              <p className="service-description">{service.description}</p>
              
              <div className="service-rating">
                <span>⭐ Rating: {service.ratings || 'Not rated'} / 5</span>
              </div>
              
              <div className="service-pricing-section">
                <strong>💰 Pricing:</strong>
                {service.pricing?.hourly > 0 && <p>⏱️ ₹{service.pricing.hourly}/hour</p>}
                {service.pricing?.fullEvent > 0 && <p>🎪 ₹{service.pricing.fullEvent}/full event</p>}
              </div>

              <div className="service-locations">
                <strong>📍 Available Locations:</strong>
                <div className="location-list">
                  {service.serviceLocations && service.serviceLocations.length > 0 
                    ? service.serviceLocations.join(', ')
                    : 'Not specified'
                  }
                </div>
              </div>

              <div className="service-contact">
                <strong>📞 Contact:</strong> {service.contactNumber || 'N/A'}
              </div>

              <button onClick={() => handleSelectService(service._id)} className="add-service-btn">
                ➕ Add Service
              </button>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="no-services">
            <p>
              {allServices.length === 0 
                ? 'No services available. Try a different service type.'
                : 'No services match your filters. Try adjusting location or date.'}
            </p>
          </div>
        )}

        {selectedServices.length > 0 && (
          <div className="selected-services-section">
            <h3>✅ Selected Services: {selectedServices.length}</h3>
            <button className="checkout-btn">💳 Proceed to Checkout</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Services;
