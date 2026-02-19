import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ isAuthenticated, userRole, setIsAuthenticated, setUserRole }) {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🎉 EventHub
        </Link>
        <ul className="nav-menu">
          <li><Link to="/">Home</Link></li>
          
          {isAuthenticated && userRole === 'customer' && (
            <>
              <li><Link to="/venues">🏛️ Browse Venues</Link></li>
              <li><Link to="/book-venue">📅 Book Venue</Link></li>
              <li><Link to="/services">🎯 Browse Services</Link></li>
              <li><Link to="/dashboard">👤 My Dashboard</Link></li>
              <li className="user-info"><span>👤 {userName}</span></li>
            </>
          )}
          
          {isAuthenticated && userRole === 'venue_owner' && (
            <>
              <li><Link to="/dashboard">🏛️ My Venues</Link></li>
              <li><Link to="/my-bookings">📋 Bookings</Link></li>
              <li><Link to="/dashboard">💳 Revenue</Link></li>
              <li className="user-info"><span>👤 {userName}</span></li>
            </>
          )}
          
          {isAuthenticated && userRole === 'service_provider' && (
            <>
              <li><Link to="/dashboard">🎯 My Services</Link></li>
              <li><Link to="/dashboard">📊 Service Bookings</Link></li>
              <li className="user-info"><span>👤 {userName}</span></li>
            </>
          )}
          
          <li>
            {isAuthenticated ? (
              <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-link">🔐 Login</Link>
                <Link to="/register" className="register-link">✍️ Register</Link>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
