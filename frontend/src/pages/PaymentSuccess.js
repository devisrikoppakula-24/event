import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const paymentId = params.get('paymentId') || params.get('razorpay_payment_id');
        const bookingId = params.get('bookingId');

        if (!paymentId || !bookingId) {
          setError('Payment not found. Missing required information.');
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');

        // Fetch payment details
        const paymentResponse = await axios.get(
          `http://localhost:5000/api/payments/${paymentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPayment(paymentResponse.data);

        // Fetch booking details
        const bookingResponse = await axios.get(
          `http://localhost:5000/api/bookings/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBooking(bookingResponse.data);

        // Fetch invoice details
        const invoiceResponse = await axios.get(
          `http://localhost:5000/api/invoices/booking/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setInvoice(invoiceResponse.data);
        setInvoiceUrl(invoiceResponse.data?.invoiceUrl);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError(err.response?.data?.message || 'Failed to fetch payment details');
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [location]);

  const handleDownloadInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      if (invoiceUrl) {
        // Download from server
        const response = await axios.get(invoiceUrl, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${invoice?.invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentChild.removeChild(link);
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
    }
  };

  const handleSendEmail = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/invoices/${invoice?._id}/send-email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Invoice sent to your email!');
    } catch (err) {
      console.error('Error sending invoice:', err);
      alert('Failed to send invoice');
    }
  };

  if (loading) {
    return (
      <div className="payment-success-container loading">
        <div className="spinner"></div>
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success-container error">
        <div className="error-content">
          <div className="error-icon">❌</div>
          <h1>Payment Error</h1>
          <p>{error}</p>
          <Link to="/customer-dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="success-card">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p className="success-message">
            Your payment has been completed successfully. Your event is confirmed!
          </p>
        </div>

        {/* Payment Summary */}
        {payment && (
          <div className="payment-summary">
            <h2>💳 Payment Summary</h2>
            <div className="summary-row">
              <span className="label">Payment ID:</span>
              <span className="value">{payment.razorpayPaymentId || payment._id}</span>
            </div>
            <div className="summary-row">
              <span className="label">Amount Paid:</span>
              <span className="value amount">₹{payment.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span className="label">Payment Method:</span>
              <span className="value method">
                {payment.paymentMethod === 'credit_card' && '💳 Credit Card'}
                {payment.paymentMethod === 'debit_card' && '💳 Debit Card'}
                {payment.paymentMethod === 'upi' && '📱 UPI'}
                {payment.paymentMethod === 'net_banking' && '🏦 Net Banking'}
                {payment.paymentMethod === 'wallet' && '💰 Wallet'}
              </span>
            </div>
            {payment.cardDetails?.last4 && (
              <div className="summary-row">
                <span className="label">Card:</span>
                <span className="value">••••••••••••{payment.cardDetails.last4}</span>
              </div>
            )}
            {payment.upiDetails?.vpa && (
              <div className="summary-row">
                <span className="label">UPI ID:</span>
                <span className="value">{payment.upiDetails.vpa}</span>
              </div>
            )}
            <div className="summary-row">
              <span className="label">Date & Time:</span>
              <span className="value">
                {new Date(payment.completedAt || payment.createdAt).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Booking Details */}
        {booking && (
          <div className="booking-details">
            <h2>🎉 Event Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">📅 Event Date:</span>
                <span className="value">{new Date(booking.eventDate).toDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="label">⏰ Time:</span>
                <span className="value">
                  {booking.eventStartTime} - {booking.eventEndTime}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">📍 Venue:</span>
                <span className="value">{booking.venue?.name || 'TBD'}</span>
              </div>
              <div className="detail-item">
                <span className="label">🎭 Event Type:</span>
                <span className="value">
                  {booking.eventType?.charAt(0).toUpperCase() + booking.eventType?.slice(1)}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">👥 Guest Count:</span>
                <span className="value">{booking.guestCount}</span>
              </div>
              <div className="detail-item">
                <span className="label">📋 Booking ID:</span>
                <span className="value">{booking._id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Details */}
        {invoice && (
          <div className="invoice-details">
            <h2>🧾 Invoice Details</h2>
            <div className="invoice-header">
              <div>
                <p className="invoice-number">Invoice No.: <strong>{invoice.invoiceNumber}</strong></p>
                <p className="invoice-date">
                  Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="invoice-total">
                <p className="total-label">Total Amount</p>
                <p className="total-amount">₹{invoice.totalAmount?.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="line-items">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                      <td>₹{item.totalPrice?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary */}
            <div className="invoice-summary">
              <div className="summary-item">
                <span>Subtotal:</span>
                <span>₹{invoice.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="summary-item">
                  <span>Tax (GST @ {invoice.taxRate}%):</span>
                  <span>₹{invoice.taxAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {invoice.discountAmount > 0 && (
                <div className="summary-item discount">
                  <span>Discount:</span>
                  <span>-₹{invoice.discountAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="summary-item total">
                <span>Total:</span>
                <span>₹{invoice.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            onClick={handleDownloadInvoice}
            className="btn btn-secondary"
            title="Download Invoice as PDF"
          >
            📥 Download Invoice
          </button>
          <button 
            onClick={handleSendEmail}
            className="btn btn-secondary"
            title="Send Invoice via Email"
          >
            📧 Send Invoice
          </button>
          <Link 
            to="/customer-dashboard"
            className="btn btn-primary"
            title="View all your bookings"
          >
            📅 View Bookings
          </Link>
          <Link 
            to="/"
            className="btn btn-tertiary"
            title="Continue browsing"
          >
            🏠 Home
          </Link>
        </div>

        {/* Help Section */}
        <div className="help-section">
          <h3>Need Help?</h3>
          <p>
            If you have any questions about your booking or payment, please{' '}
            <a href="mailto:support@eventplanning.com">contact our support team</a> or call{' '}
            <a href="tel:+919876543210">+91 9876543210</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
