import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Login({ setIsAuthenticated, setUserRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        // ✅ Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user._id);
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('userName', response.data.user.name);
        localStorage.setItem('userEmail', response.data.user.email);

        // Set axios default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

        setIsAuthenticated(true);
        setUserRole(response.data.user.role);

        console.log('✅ Login successful:', response.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-box">
          {/* Logo Section */}
          <div className="logo-section">
            <div className="logo-icon">📅</div>
            <h1 className="logo-text">Event Manager</h1>
          </div>

          {/* Welcome Heading */}
          <h2 className="welcome-heading">Welcome Back!</h2>
          <p className="welcome-subtext">Log in to your account</p>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="auth-input"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="auth-input"
                />
              </div>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? '⏳ Logging in...' : 'Log In'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>or</span>
          </div>

          {/* Social Login Buttons */}
          <div className="social-login">
            <button type="button" className="social-btn facebook-btn" disabled={loading}>
              <span className="social-icon">f</span>
              Log in with Facebook
            </button>
            <button type="button" className="social-btn google-btn" disabled={loading}>
              <span className="social-icon">G</span>
              Log in with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="signup-section">
            <p>New Here?</p>
            <Link to="/register" className="signup-link">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
