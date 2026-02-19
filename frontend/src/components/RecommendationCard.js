import React, { useState } from 'react';
import './RecommendationCard.css';

function RecommendationCard({ 
  recommendation, 
  type = 'venue', 
  onBook, 
  onLearnMore 
}) {
  const [showReasons, setShowReasons] = useState(false);

  const {
    _id,
    name,
    location,
    price,
    rating,
    images,
    capacity,
    reasonsForRecommendation,
    score
  } = recommendation;

  const handleBook = (e) => {
    e.stopPropagation();
    if (onBook) {
      onBook(_id);
    }
  };

  const handleLearnMore = () => {
    if (onLearnMore) {
      onLearnMore(_id, type);
    }
  };

  const getImageUrl = () => {
    if (images && images.length > 0) {
      return images[0];
    }
    return type === 'venue'
      ? 'https://via.placeholder.com/300x200?text=Venue'
      : 'https://via.placeholder.com/300x200?text=Service';
  };

  return (
    <div className="recommendation-card">
      {/* Image Section */}
      <div className="card-image">
        <img src={getImageUrl()} alt={name} />
        <div className="score-badge">
          <span className="score-value">{Math.round(score)}</span>
          <span className="score-label">Match</span>
        </div>
        {rating && (
          <div className="rating-badge">
            {'⭐'.repeat(Math.round(rating))}
            <span className="rating-number">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="card-content">
        <h3 className="card-title">{name}</h3>

        {location && (
          <p className="card-location">📍 {location}</p>
        )}

        {type === 'venue' && capacity && (
          <p className="card-detail">👥 Capacity: {capacity} guests</p>
        )}

        {price && (
          <p className="card-price">
            💰 {typeof price === 'number' ? `₹${price.toLocaleString()}` : price}
            {type === 'service' && '/event'}
          </p>
        )}

        {/* Reasons for Recommendation */}
        {reasonsForRecommendation && reasonsForRecommendation.length > 0 && (
          <div className="reasons-section">
            <button
              className="reasons-toggle"
              onClick={() => setShowReasons(!showReasons)}
            >
              {showReasons ? '✓ Why Recommended ▼' : '? Why Recommended'}
            </button>

            {showReasons && (
              <ul className="reasons-list">
                {reasonsForRecommendation.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="card-actions">
          <button className="btn-learn-more" onClick={handleLearnMore}>
            🔍 View Details
          </button>
          <button className="btn-book" onClick={handleBook}>
            📅 {type === 'venue' ? 'Book Now' : 'Inquire'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecommendationCard;
