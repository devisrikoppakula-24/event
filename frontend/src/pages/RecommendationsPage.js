import React, { useState } from 'react';
import RecommendationList from '../components/RecommendationList';
import './RecommendationsPage.css';

function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState('venues');
  const [venueFilters, setVenueFilters] = useState({});
  const [serviceFilters, setServiceFilters] = useState({});

  const handleVenueFilterChange = (e) => {
    const { name, value } = e.target;
    setVenueFilters({
      ...venueFilters,
      [name]: name === 'guestCount' || name === 'budget' ? parseInt(value) : value
    });
  };

  const handleServiceFilterChange = (e) => {
    const { name, value } = e.target;
    setServiceFilters({
      ...serviceFilters,
      [name]: value
    });
  };

  const handleViewDetails = (id, type) => {
    // Navigate to detail page
    window.location.href = `/${type}/${id}`;
  };

  return (
    <div className="recommendations-page">
      <div className="page-header">
        <h1>🎯 Smart Recommendations</h1>
        <p>Get personalized venue and service recommendations based on your event needs</p>
      </div>

      <div className="recommendations-content">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'venues' ? 'active' : ''}`}
            onClick={() => setActiveTab('venues')}
          >
            🏛️ Venue Recommendations
          </button>
          <button
            className={`tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            🎭 Service Recommendations
          </button>
          <button
            className={`tab ${activeTab === 'personalized' ? 'active' : ''}`}
            onClick={() => setActiveTab('personalized')}
          >
            📊 Personalized (Based on History)
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          {activeTab === 'venues' && (
            <form className="filters-form">
              <div className="filter-group">
                <label htmlFor="eventType">Event Type</label>
                <select
                  id="eventType"
                  name="eventType"
                  value={venueFilters.eventType || ''}
                  onChange={handleVenueFilterChange}
                >
                  <option value="">Select Event Type</option>
                  <option value="wedding">Wedding</option>
                  <option value="birthday">Birthday</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="conference">Conference</option>
                  <option value="seminar">Seminar</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  placeholder="e.g., New York, Delhi"
                  value={venueFilters.location || ''}
                  onChange={handleVenueFilterChange}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="guestCount">Guest Count</label>
                <input
                  id="guestCount"
                  type="number"
                  name="guestCount"
                  placeholder="e.g., 100"
                  min="1"
                  max="10000"
                  value={venueFilters.guestCount || ''}
                  onChange={handleVenueFilterChange}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="budget">Budget (₹)</label>
                <input
                  id="budget"
                  type="number"
                  name="budget"
                  placeholder="e.g., 50000"
                  min="1"
                  value={venueFilters.budget || ''}
                  onChange={handleVenueFilterChange}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="eventDate">Event Date</label>
                <input
                  id="eventDate"
                  type="date"
                  name="eventDate"
                  value={venueFilters.eventDate || ''}
                  onChange={handleVenueFilterChange}
                />
              </div>

              <button type="button" className="clear-btn" onClick={() => setVenueFilters({})}>
                Clear Filters
              </button>
            </form>
          )}

          {activeTab === 'services' && (
            <form className="filters-form">
              <div className="filter-group">
                <label htmlFor="serviceType">Service Type</label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={serviceFilters.serviceType || ''}
                  onChange={handleServiceFilterChange}
                >
                  <option value="">Select Service Type</option>
                  <option value="catering">Catering</option>
                  <option value="photography">Photography</option>
                  <option value="decoration">Decoration</option>
                  <option value="music">Music & DJ</option>
                  <option value="makeup">Makeup & Beauty</option>
                  <option value="transportation">Transportation</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="slocation">Location</label>
                <input
                  id="slocation"
                  type="text"
                  name="location"
                  placeholder="e.g., New York, Delhi"
                  value={serviceFilters.location || ''}
                  onChange={handleServiceFilterChange}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="sbudget">Budget (₹)</label>
                <input
                  id="sbudget"
                  type="number"
                  name="budget"
                  placeholder="e.g., 10000"
                  min="1"
                  value={serviceFilters.budget || ''}
                  onChange={handleServiceFilterChange}
                />
              </div>

              <button type="button" className="clear-btn" onClick={() => setServiceFilters({})}>
                Clear Filters
              </button>
            </form>
          )}

          {activeTab === 'personalized' && (
            <div className="personalized-info">
              <p>📍 Based on your booking history, we recommend venues and services similar to your preferences.</p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <RecommendationList
          type={activeTab}
          filters={activeTab === 'venues' ? venueFilters : activeTab === 'services' ? serviceFilters : {}}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  );
}

export default RecommendationsPage;
