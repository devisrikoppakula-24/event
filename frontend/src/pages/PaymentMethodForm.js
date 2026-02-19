import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PaymentMethodForm.css';

function PaymentMethodForm({ bookingData, totalAmount, onPaymentComplete, onCancel }) {
  const [activeTab, setActiveTab] = useState('upi'); // upi, card, netbanking
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(null);

  // UPI State
  const [upiData, setUpiData] = useState({
    vpa: '',
    app: 'google_pay' // default
  });

  // Card State
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  // Net Banking State
  const [netBankingData, setNetBankingData] = useState({
    bank: ''
  });

  const upiApps = [
    { id: 'google_pay', name: '🔵 Google Pay', icon: '💳' },
    { id: 'phonepe', name: '🟣 PhonePe', icon: '📱' },
    { id: 'paytm', name: '🔵 Paytm', icon: '💰' },
    { id: 'whatsapp_pay', name: '💬 WhatsApp Pay', icon: '💬' }
  ];

  const banks = [
    { code: 'HDFC', name: '🏦 HDFC Bank' },
    { code: 'ICIC', name: '🏦 ICICI Bank' },
    { code: 'SBIN', name: '🏦 State Bank of India' },
    { code: 'AXIS', name: '🏦 Axis Bank' },
    { code: 'KOTAK', name: '🏦 Kotak Mahindra Bank' },
    { code: 'IDBI', name: '🏦 IDBI Bank' }
  ];

  const cardBrands = [
    { type: 'visa', name: '💳 Visa', regex: /^4[0-9]{12}(?:[0-9]{3})?$/ },
    { type: 'mastercard', name: '💳 MasterCard', regex: /^5[1-5][0-9]{14}$/ },
    { type: 'amex', name: '💳 American Express', regex: /^3[47][0-9]{13}$/ }
  ];

  useEffect(() => {
    fetchSavedMethods();
  }, []);

  const fetchSavedMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedMethods(response.data);
    } catch (err) {
      console.error('Error fetching saved payment methods:', err);
    }
  };

  const detectCardBrand = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return cardBrands.find(brand => brand.regex.test(cleanNumber))?.type || 'unknown';
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').slice(0, 19);
  };

  const handleUPIPayment = async (e) => {
    e.preventDefault();
    if (!upiData.vpa) {
      setError('Please enter a valid UPI ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Initiate UPI payment via Razorpay
      const response = await axios.post(
        'http://localhost:5000/api/payments/initiate-upi',
        {
          bookingId: bookingData._id,
          amount: totalAmount * 100,
          currency: 'INR',
          vpa: upiData.vpa,
          app: upiData.app
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, key } = response.data;

      // Open Razorpay checkout
      const options = {
        key: key,
        amount: totalAmount * 100,
        currency: 'INR',
        order_id: orderId,
        name: 'Event Booking Payment',
        description: 'UPI Payment for Event Booking',
        timeout: 600,
        handler: async (paymentResponse) => {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              'http://localhost:5000/api/payments/verify-payment',
              {
                bookingId: bookingData._id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpaySignature: paymentResponse.razorpay_signature,
                paymentMethod: 'upi',
                upiVpa: upiData.vpa
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data.success) {
              onPaymentComplete(verifyResponse.data.payment);
            }
          } catch (err) {
            setError('Payment verification failed: ' + err.response?.data?.message);
            setLoading(false);
          }
        },
        prefill: {
          contact: bookingData.customerPhone,
          email: bookingData.customerEmail
        },
        theme: { color: '#667eea' }
      };

      const RazorpayWindow = window.Razorpay;
      const rzp = new RazorpayWindow(options);
      rzp.open();
    } catch (err) {
      setError('Error initiating payment: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!cardData.cardNumber || !cardData.cardholderName || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv) {
      setError('Please fill all card details');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const cardBrand = detectCardBrand(cardData.cardNumber);

      // Initiate card payment
      const response = await axios.post(
        'http://localhost:5000/api/payments/initiate-card',
        {
          bookingId: bookingData._id,
          amount: totalAmount * 100,
          currency: 'INR',
          card: {
            number: cardData.cardNumber.replace(/\s/g, ''),
            name: cardData.cardholderName,
            expiry_month: cardData.expiryMonth,
            expiry_year: cardData.expiryYear,
            cvv: cardData.cvv
          },
          brand: cardBrand
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, key } = response.data;

      // Open Razorpay checkout
      const options = {
        key: key,
        amount: totalAmount * 100,
        currency: 'INR',
        order_id: orderId,
        name: 'Event Booking Payment',
        description: `${cardBrand.toUpperCase()} Card Payment`,
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await axios.post(
              'http://localhost:5000/api/payments/verify-payment',
              {
                bookingId: bookingData._id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpaySignature: paymentResponse.razorpay_signature,
                paymentMethod: 'credit_card',
                cardLast4: cardData.cardNumber.slice(-4),
                cardBrand: cardBrand
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data.success) {
              onPaymentComplete(verifyResponse.data.payment);
            }
          } catch (err) {
            setError('Payment verification failed: ' + err.response?.data?.message);
            setLoading(false);
          }
        },
        prefill: {
          name: cardData.cardholderName,
          contact: bookingData.customerPhone,
          email: bookingData.customerEmail
        },
        theme: { color: '#667eea' }
      };

      const RazorpayWindow = window.Razorpay;
      const rzp = new RazorpayWindow(options);
      rzp.open();
    } catch (err) {
      setError('Error initiating payment: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNetBankingPayment = async (e) => {
    e.preventDefault();
    
    if (!netBankingData.bank) {
      setError('Please select a bank');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      // Initiate net banking payment
      const response = await axios.post(
        'http://localhost:5000/api/payments/initiate-netbanking',
        {
          bookingId: bookingData._id,
          amount: totalAmount * 100,
          currency: 'INR',
          bank: netBankingData.bank
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, key } = response.data;

      // Open Razorpay checkout
      const options = {
        key: key,
        amount: totalAmount * 100,
        currency: 'INR',
        order_id: orderId,
        name: 'Event Booking Payment',
        description: 'Net Banking Payment',
        method: { netbanking: true },
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await axios.post(
              'http://localhost:5000/api/payments/verify-payment',
              {
                bookingId: bookingData._id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpaySignature: paymentResponse.razorpay_signature,
                paymentMethod: 'net_banking',
                bankName: netBankingData.bank
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data.success) {
              onPaymentComplete(verifyResponse.data.payment);
            }
          } catch (err) {
            setError('Payment verification failed: ' + err.response?.data?.message);
            setLoading(false);
          }
        },
        prefill: {
          contact: bookingData.customerPhone,
          email: bookingData.customerEmail
        },
        theme: { color: '#667eea' }
      };

      const RazorpayWindow = window.Razorpay;
      const rzp = new RazorpayWindow(options);
      rzp.open();
    } catch (err) {
      setError('Error initiating payment: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-method-form">
      <h2>💳 Select Payment Method</h2>

      {error && <div className="error-message">❌ {error}</div>}

      <div className="amount-display">
        <span>Total Amount:</span>
        <span className="amount">₹{totalAmount.toLocaleString('en-IN')}</span>
      </div>

      {/* Payment Method Tabs */}
      <div className="payment-tabs">
        <button
          className={`tab-button ${activeTab === 'upi' ? 'active' : ''}`}
          onClick={() => setActiveTab('upi')}
        >
          📱 UPI
        </button>
        <button
          className={`tab-button ${activeTab === 'card' ? 'active' : ''}`}
          onClick={() => setActiveTab('card')}
        >
          💳 Card
        </button>
        <button
          className={`tab-button ${activeTab === 'netbanking' ? 'active' : ''}`}
          onClick={() => setActiveTab('netbanking')}
        >
          🏦 Net Banking
        </button>
      </div>

      {/* UPI Payment */}
      {activeTab === 'upi' && (
        <form onSubmit={handleUPIPayment} className="payment-form">
          <div className="form-group">
            <label>Select UPI App</label>
            <div className="upi-apps-grid">
              {upiApps.map(app => (
                <button
                  key={app.id}
                  type="button"
                  className={`upi-app-button ${upiData.app === app.id ? 'selected' : ''}`}
                  onClick={() => setUpiData({ ...upiData, app: app.id })}
                >
                  {app.icon} {app.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vpa">UPI ID / VPA</label>
            <input
              id="vpa"
              type="text"
              placeholder="yourname@googlepay"
              value={upiData.vpa}
              onChange={(e) => setUpiData({ ...upiData, vpa: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-pay" disabled={loading}>
            {loading ? '⏳ Processing...' : '✅ Pay via UPI'}
          </button>
        </form>
      )}

      {/* Card Payment */}
      {activeTab === 'card' && (
        <form onSubmit={handleCardPayment} className="payment-form">
          <div className="form-group">
            <label htmlFor="cardNumber">Card Number</label>
            <input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formatCardNumber(cardData.cardNumber)}
              onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
              maxLength="19"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cardholderName">Cardholder Name</label>
            <input
              id="cardholderName"
              type="text"
              placeholder="John Doe"
              value={cardData.cardholderName}
              onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date</label>
              <div className="expiry-inputs">
                <input
                  id="expiryMonth"
                  type="number"
                  placeholder="MM"
                  value={cardData.expiryMonth}
                  onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                  min="1"
                  max="12"
                  maxLength="2"
                  required
                />
                <span>/</span>
                <input
                  id="expiryYear"
                  type="number"
                  placeholder="YY"
                  value={cardData.expiryYear}
                  onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                  min="24"
                  maxLength="2"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                type="password"
                placeholder="123"
                value={cardData.cvv}
                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                maxLength="4"
                required
              />
            </div>
          </div>

          <div className="security-info">
            🔒 Your card details are encrypted and secure
          </div>

          <button type="submit" className="btn-pay" disabled={loading}>
            {loading ? '⏳ Processing...' : '💳 Pay with Card'}
          </button>
        </form>
      )}

      {/* Net Banking Payment */}
      {activeTab === 'netbanking' && (
        <form onSubmit={handleNetBankingPayment} className="payment-form">
          <div className="form-group">
            <label htmlFor="bank">Select Your Bank</label>
            <select
              id="bank"
              value={netBankingData.bank}
              onChange={(e) => setNetBankingData({ ...netBankingData, bank: e.target.value })}
              required
            >
              <option value="">-- Select Bank --</option>
              {banks.map(bank => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bank-info">
            <p>💡 You will be redirected to your bank's secure login page</p>
            <p>🔒 Your banking details are never shared with us</p>
          </div>

          <button type="submit" className="btn-pay" disabled={loading}>
            {loading ? '⏳ Redirecting...' : '🏦 Pay via Net Banking'}
          </button>
        </form>
      )}

      {/* Cancel Button */}
      <button onClick={onCancel} className="btn-cancel">
        ✕ Cancel Payment
      </button>

      {/* Security Footer */}
      <div className="security-footer">
        <p>🔐 All payments are secured by Razorpay, India's most trusted payment gateway</p>
      </div>
    </div>
  );
}

export default PaymentMethodForm;
