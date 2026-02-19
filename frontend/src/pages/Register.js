import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        role: formData.role,
        location: formData.location
      });

      if (response.data.success) {
        // ✅ Store token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user._id);
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('userName', response.data.user.name);
        localStorage.setItem('userEmail', response.data.user.email);

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

        console.log('✅ Registration successful:', response.data.user);
        alert(`Welcome ${response.data.user.name}! Your account has been created.`);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>📝 Create Account</h2>
        {error && <div className="error-message">❌ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              placeholder="Your full name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Mobile Number *</label>
            <input
              type="tel"
              name="mobile"
              placeholder="10-digit mobile number"
              value={formData.mobile}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>I am a *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="customer">Customer (Looking for venues)</option>
              <option value="venue_owner">Venue Owner</option>
              <option value="service_provider">Service Provider</option>
            </select>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              placeholder="City/Area"
              value={formData.location}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? '⏳ Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
