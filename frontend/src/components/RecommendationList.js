import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecommendationCard from './RecommendationCard';
import './RecommendationList.css';

function RecommendationList({ type = 'venues', filters = {}, onViewDetails }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchRecommendations();
    }
  }, [filters, type]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      let endpoint = 'http://localhost:5000/api/recommendations';
      let payload = {};

      if (type === 'venues') {
        endpoint += '/venues';
        payload = {
          eventType: filters.eventType || 'wedding',
          guestCount: filters.guestCount || 100,
          budget: filters.budget || 50000,
          location: filters.location || '',
          eventDate: filters.eventDate || new Date().toISOString().date,
          preferences: filters.preferences || []
        };
      } else if (type === 'services') {
        endpoint += '/services';
        payload = {
          serviceType: filters.serviceType || 'catering',
          location: filters.location || '',
          budget: filters.budget || 10000,
          preferences: filters.preferences || []
        };
      } else if (type === 'personalized') {
        endpoint += '/personalized';
      }

      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecommendations(response.data.recommendations || []);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (id) => {
    // Navigate to booking page or open booking modal
    console.log('Booking:', id);
    if (onViewDetails) {
      onViewDetails(id, type);
    }
  };

  const handleLearnMore = (id, itemType) => {
    if (onViewDetails) {
      onViewDetails(id, itemType);
    }
  };

  return (
    <div className="recommendation-list-container">
      {Object.keys(filters).length === 0 && !['personalized'].includes(type) && (
        <div className="empty-state">
          <p>🎯 Set your preferences to get personalized recommendations</p>
        </div>
      )}

      {loading && (
        <div className="loading">
          <p>🔍 Finding perfect matches for you...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {recommendations.length === 0 && !loading && Object.keys(filters).length > 0 ? (
        <div className="no-recommendations">
          <p>😕 No matching recommendations found. Try adjusting your preferences.</p>
        </div>
      ) : (
        <div className="recommendations-grid">
          {recommendations.map(recommendation => (
            <RecommendationCard
              key={recommendation._id}
              recommendation={recommendation}
              type={type === 'services' ? 'service' : 'venue'}
              onBook={handleBook}
              onLearnMore={handleLearnMore}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RecommendationList;
