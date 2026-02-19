import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import VenueSearch from './pages/VenueSearch';
import VenueDetail from './pages/VenueDetail';
import Services from './pages/Services';
import CustomerDashboard from './pages/CustomerDashboard';
import VenueOwnerDashboard from './pages/VenueOwnerDashboard';
import ServiceProviderDashboard from './pages/ServiceProviderDashboard';
import VenueBooking from './pages/VenueBooking';
import VenueBookings from './pages/VenueBookings';
import VenueOwnerBookings from './pages/VenueOwnerBookings';
import PaymentSuccess from './pages/PaymentSuccess';

// Role-based route protector component
const ProtectedRoute = ({ element, requiredRole, userRole }) => {
  if (!requiredRole) {
    return element; // No role restriction
  }
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole) ? element : <Navigate to="/unauthorized" />;
  }
  return userRole === requiredRole ? element : <Navigate to="/unauthorized" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} userRole={userRole} setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
        <Route path="/register" element={<Register />} />

        {/* UNAUTHORIZED PAGE */}
        <Route path="/unauthorized" element={
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666' }}>
            <h2>❌ Unauthorized Access</h2>
            <p>You don't have permission to access this page.</p>
            <p>Please contact support if you believe this is an error.</p>
          </div>
        } />

        {/* CUSTOMER-ONLY ROUTES */}
        <Route path="/venues" element={
          isAuthenticated ? (
            <ProtectedRoute element={<VenueSearch />} requiredRole="customer" userRole={userRole} />
          ) : (
            <Navigate to="/login" />
          )
        } />
        
        <Route path="/venue/:id" element={
          isAuthenticated ? (
            <ProtectedRoute element={<VenueDetail />} requiredRole="customer" userRole={userRole} />
          ) : (
            <Navigate to="/login" />
          )
        } />
        
        <Route path="/services" element={
          isAuthenticated ? (
            <ProtectedRoute element={<Services />} requiredRole="customer" userRole={userRole} />
          ) : (
            <Navigate to="/login" />
          )
        } />

        {/* BOOK VENUE - ACCESSIBLE TO ALL (customers and unauthenticated users) */}
        <Route path="/book-venue" element={<VenueBooking />} />

        {/* PAYMENT SUCCESS PAGE */}
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* VENUE OWNER-ONLY ROUTES */}
        <Route path="/venue-bookings" element={
          isAuthenticated ? (
            <ProtectedRoute element={<VenueBookings />} requiredRole="venue_owner" userRole={userRole} />
          ) : (
            <Navigate to="/login" />
          )
        } />
        
        <Route path="/my-bookings" element={
          isAuthenticated ? (
            <ProtectedRoute element={<VenueOwnerBookings />} requiredRole="venue_owner" userRole={userRole} />
          ) : (
            <Navigate to="/login" />
          )
        } />

        {/* DASHBOARD - ROLE-BASED */}
        <Route path="/dashboard" element={
          !isAuthenticated ? (
            <Navigate to="/login" />
          ) : userRole === 'customer' ? (
            <CustomerDashboard />
          ) : userRole === 'venue_owner' ? (
            <VenueOwnerDashboard />
          ) : userRole === 'service_provider' ? (
            <ServiceProviderDashboard />
          ) : (
            <Navigate to="/unauthorized" />
          )
        } />

        {/* CATCH-ALL - REDIRECT TO HOME */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
