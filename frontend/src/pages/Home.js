import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <div className="hero">
        <h1>Welcome to EventHub</h1>
        <p>Your one-stop platform for planning perfect events</p>
        <Link to="/venues" className="btn-primary" style={{ display: 'inline-block' }}>
          Explore Venues
        </Link>
      </div>

      <div className="cards-grid" style={{ marginTop: '40px' }}>
        <div className="card">
          <h3>🏛️ Find Venues</h3>
          <p>Browse hundreds of beautiful venues in your area. Filter by location, capacity, and price.</p>
        </div>
        <div className="card">
          <h3>🎨 Hire Services</h3>
          <p>Connect with caterers, decorators, makeup artists, and more professional service providers.</p>
        </div>
        <div className="card">
          <h3>📅 Easy Booking</h3>
          <p>Seamless booking experience with real-time availability and secure payment processing.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
