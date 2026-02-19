import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReviewList.css';

function ReviewList({ serviceId, venueId }) {
  const [reviews, setReviews] = useState([]);
  const [ratingBreakdown, setRatingBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState({});
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchReviews();
  }, [serviceId, venueId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const endpoint = serviceId
        ? `http://localhost:5000/api/reviews/service/${serviceId}`
        : `http://localhost:5000/api/reviews/venue/${venueId}`;

      const response = await axios.get(endpoint);
      setReviews(response.data.reviews || []);
      setRatingBreakdown(response.data.ratingBreakdown);
    } catch (err) {
      setError('Failed to load reviews');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/reviews/${reviewId}/helpful`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReviews(); // Refresh reviews
    } catch (err) {
      console.error('Error marking as helpful:', err);
    }
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://localhost:5000/api/reviews/${reviewId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchReviews(); // Refresh reviews
      } catch (err) {
        console.error('Error deleting review:', err);
      }
    }
  };

  const renderStars = (rating) => {
    return (
      <span className="star-display">
        {'⭐'.repeat(Math.round(rating))}
        <span className="rating-value">{rating.toFixed(1)}</span>
      </span>
    );
  };

  const renderBreakdown = () => {
    if (!ratingBreakdown) return null;

    const { average, distribution } = ratingBreakdown;

    return (
      <div className="rating-breakdown">
        <div className="overall-rating">
          <div className="large-stars">{renderStars(average)}</div>
          <p className="total-reviews">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="distribution">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="distribution-row">
              <span className="star-label">{star} ⭐</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{
                    width: `${distribution[star] ? (distribution[star] / reviews.length) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="count">{distribution[star] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading reviews...</div>;
  }

  return (
    <div className="review-list-container">
      <h3>Customer Reviews</h3>

      {renderBreakdown()}

      {error && <div className="alert alert-error">{error}</div>}

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <p>🎯 No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="reviews-grid">
          {reviews.map(review => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <h4 className="reviewer-name">
                    {review.customerName || 'Anonymous'}
                    {review.isVerified && <span className="verified-badge" title="Verified Purchase">✓</span>}
                  </h4>
                  <p className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="review-rating">{renderStars(review.rating)}</div>
              </div>

              {review.title && (
                <h5 className="review-title">{review.title}</h5>
              )}

              <p className="review-comment">{review.comment}</p>

              {/* Detailed ratings for service */}
              {review.serviceQuality && (
                <div className="detailed-breakdown">
                  <div className="detail-item">
                    <span>Service Quality:</span>
                    <span className="detail-rating">{'⭐'.repeat(review.serviceQuality)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Timeliness:</span>
                    <span className="detail-rating">{'⭐'.repeat(review.timeliness)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Value for Money:</span>
                    <span className="detail-rating">{'⭐'.repeat(review.valueForMoney)}</span>
                  </div>
                </div>
              )}

              {/* Detailed ratings for venue */}
              {review.ambiance && (
                <div className="detailed-breakdown">
                  <div className="detail-item">
                    <span>Ambiance:</span>
                    <span className="detail-rating">{'⭐'.repeat(review.ambiance)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Cleanliness:</span>
                    <span className="detail-rating">{'⭐'.repeat(review.cleanliness)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Facilities:</span>
                    <span className="detail-rating">{'⭐'.repeat(review.facilities)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Staff:</span>
                    <span className="detail-rating">{'⭐'.repeat(review.staff)}</span>
                  </div>
                </div>
              )}

              <div className="review-footer">
                <button
                  className="helpful-btn"
                  onClick={() => handleHelpful(review._id)}
                >
                  👍 Helpful ({review.helpfulCount || 0})
                </button>

                {userId === review.customerId && (
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(review._id)}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewList;
