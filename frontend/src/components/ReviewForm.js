import React, { useState } from 'react';
import axios from 'axios';
import './ReviewForm.css';

function ReviewForm({ serviceId, venueId, onReviewSubmitted }) {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    serviceQuality: 5,
    timeliness: 5,
    valueForMoney: 5,
    ambiance: 5,
    cleanliness: 5,
    facilities: 5,
    staff: 5
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRatingChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const customerName = localStorage.getItem('userName') || 'Anonymous';

      const endpoint = serviceId
        ? `http://localhost:5000/api/reviews/service/${serviceId}`
        : `http://localhost:5000/api/reviews/venue/${venueId}`;

      const response = await axios.post(endpoint, {
        ...formData,
        customerName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(response.data.message);
      setFormData({
        rating: 5,
        title: '',
        comment: '',
        serviceQuality: 5,
        timeliness: 5,
        valueForMoney: 5,
        ambiance: 5,
        cleanliness: 5,
        facilities: 5,
        staff: 5
      });

      if (onReviewSubmitted) {
        onReviewSubmitted(response.data.review);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  const isService = !!serviceId;

  return (
    <div className="review-form-container">
      <h3>Share Your Experience</h3>
      <p className="review-subtitle">Help other customers make informed decisions</p>

      <form onSubmit={handleSubmit} className="review-form">
        {/* Overall Rating */}
        <div className="form-group">
          <label>Overall Rating *</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star ${formData.rating >= star ? 'active' : ''}`}
                onClick={() => handleRatingChange('rating', star)}
              >
                ⭐
              </button>
            ))}
          </div>
          <p className="rating-text">{formData.rating} out of 5 stars</p>
        </div>

        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Review Title</label>
          <input
            id="title"
            type="text"
            name="title"
            placeholder="e.g., Excellent service for our wedding!"
            value={formData.title}
            onChange={handleChange}
            maxLength="100"
          />
        </div>

        {/* Comment */}
        <div className="form-group">
          <label htmlFor="comment">Your Review * (Minimum 15 characters)</label>
          <textarea
            id="comment"
            name="comment"
            placeholder="Share your detailed experience..."
            value={formData.comment}
            onChange={handleChange}
            rows="5"
            required
            minLength="15"
          />
          <small>{formData.comment.length}/500 characters</small>
        </div>

        {/* Detailed Ratings */}
        {isService ? (
          <div className="detailed-ratings">
            <h4>Rate Different Aspects</h4>

            <div className="rating-row">
              <label>Service Quality</label>
              <div className="small-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`small-star ${formData.serviceQuality >= star ? 'active' : ''}`}
                    onClick={() => handleRatingChange('serviceQuality', star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="rating-row">
              <label>Timeliness</label>
              <div className="small-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`small-star ${formData.timeliness >= star ? 'active' : ''}`}
                    onClick={() => handleRatingChange('timeliness', star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="rating-row">
              <label>Value for Money</label>
              <div className="small-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`small-star ${formData.valueForMoney >= star ? 'active' : ''}`}
                    onClick={() => handleRatingChange('valueForMoney', star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="detailed-ratings">
            <h4>Rate Different Aspects</h4>

            <div className="rating-row">
              <label>Ambiance</label>
              <div className="small-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`small-star ${formData.ambiance >= star ? 'active' : ''}`}
                    onClick={() => handleRatingChange('ambiance', star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="rating-row">
              <label>Cleanliness</label>
              <div className="small-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`small-star ${formData.cleanliness >= star ? 'active' : ''}`}
                    onClick={() => handleRatingChange('cleanliness', star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="rating-row">
              <label>Facilities</label>
              <div className="small-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`small-star ${formData.facilities >= star ? 'active' : ''}`}
                    onClick={() => handleRatingChange('facilities', star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="rating-row">
              <label>Staff Behavior</label>
              <div className="small-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`small-star ${formData.staff >= star ? 'active' : ''}`}
                    onClick={() => handleRatingChange('staff', star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? '⏳ Submitting...' : '✅ Submit Review'}
        </button>
      </form>
    </div>
  );
}

export default ReviewForm;
