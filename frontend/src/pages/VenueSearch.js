import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './VenueSearch.css';

function VenueSearch() {
  const [allVenues, setAllVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    location: '',
    minCapacity: '',
    maxPrice: '',
    eventDate: ''
  });

  // Load all venues on component mount
  useEffect(() => {
    const fetchAllVenues = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/venues/search?location=all');
        setAllVenues(response.data);
        setFilteredVenues(response.data);
        console.log(`✅ Loaded ${response.data.length} venues`);
      } catch (err) {
        console.error('Error fetching venues:', err);
        setAllVenues([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllVenues();
  }, []);

  // Auto-apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = useCallback(() => {
    let filtered = allVenues;

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(v =>
        v.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filter by minimum capacity
    if (filters.minCapacity) {
      filtered = filtered.filter(v => v.capacity >= parseInt(filters.minCapacity));
    }

    // Filter by maximum price
    if (filters.maxPrice) {
      filtered = filtered.filter(v => v.pricePerDay <= parseInt(filters.maxPrice));
    }

    // Filter by event date if venue has availableDates
    if (filters.eventDate) {
      filtered = filtered.filter(v => {
        if (!v.availableDates || v.availableDates.length === 0) return true;
        const selectedDate = new Date(filters.eventDate).toLocaleDateString();
        return v.availableDates.some(date => 
          new Date(date).toLocaleDateString() === selectedDate
        );
      });
    }

    setFilteredVenues(filtered);
  }, [allVenues, filters]);

  return (
    <div className="container">
      <div className="venues-search-page">
        <h1>🏛️ Find Your Perfect Venue</h1>

        {/* Advanced Filters Section */}
        <div className="filter-section">
          <h2>Search & Filter Venues</h2>
          <div className="filter-grid">
            <div className="filter-group">
              <label htmlFor="location">📍 Location:</label>
              <input
                id="location"
                type="text"
                name="location"
                placeholder="Enter city, area, or pincode"
                value={filters.location}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="minCapacity">👥 Minimum Capacity:</label>
              <input
                id="minCapacity"
                type="number"
                name="minCapacity"
                placeholder="e.g., 100"
                value={filters.minCapacity}
                onChange={handleFilterChange}
                min="0"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="maxPrice">💰 Max Price (per day):</label>
              <input
                id="maxPrice"
                type="number"
                name="maxPrice"
                placeholder="e.g., 50000"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                min="0"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="eventDate">📅 Event Date:</label>
              <input
                id="eventDate"
                type="date"
                name="eventDate"
                value={filters.eventDate}
                onChange={handleFilterChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {(filters.location || filters.minCapacity || filters.maxPrice || filters.eventDate) && (
              <button 
                className="clear-filters-btn"
                onClick={() => setFilters({ location: '', minCapacity: '', maxPrice: '', eventDate: '' })}
              >
                ✕ Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>
            Showing <strong>{filteredVenues.length}</strong> venue{filteredVenues.length !== 1 ? 's' : ''}
            {Object.values(filters).some(v => v) && ' matching your criteria'}
          </p>
        </div>

        {loading && <p className="loading-message">⏳ Loading venues...</p>}

        <div className="venues-grid">
          {filteredVenues.map(venue => (
            <div key={venue._id} className="venue-card">
              <img src={venue.images[0]} alt={venue.name} />
              <h3>{venue.name}</h3>
              <p className="location">📍 {venue.location}</p>
              <p className="rating">⭐ {venue.ratings} ratings</p>
              <p className="capacity">👥 Capacity: {venue.capacity} people</p>
              <p className="price">💰 ₹{venue.pricePerDay}/day</p>
              <Link to={`/venue/${venue._id}`} className="btn-primary">
                View Details
              </Link>
            </div>
          ))}
        </div>

        {filteredVenues.length === 0 && !loading && (
          <div className="no-venues">
            <p>
              {allVenues.length === 0
                ? '😞 No venues available at the moment.'
                : '😞 No venues match your filters. Try adjusting your search criteria.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VenueSearch;
