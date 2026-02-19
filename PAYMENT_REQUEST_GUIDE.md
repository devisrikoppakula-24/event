# 💳 Razorpay Payment Request System - Complete Guide

## Overview
The payment request system allows venue owners to request payments from customers for their event bookings. Customers can then pay these requests directly through Razorpay.

## Features Added

### 1. Backend Features

#### Updated Booking Model
- **paymentRequests**: Array of payment request objects
  - `_id`: Unique payment request ID
  - `amount`: Amount requested (in rupees)
  - `description`: Description of what payment is for
  - `status`: 'pending', 'paid', or 'expired'
  - `razorpayOrderId`: Razorpay order ID
  - `razorpayPaymentId`: Razorpay payment ID
  - `razorpaySignature`: Payment signature for verification
  - `createdAt`: When request was created
  - `expiresAt`: When request expires

#### New API Endpoints

##### 1. Create Payment Request
**POST** `/api/bookings/:bookingId/payment-request`
- **Auth Required**: Yes (Bearer token)
- **Description**: Create a new payment request for a booking
- **Body Parameters**:
  ```json
  {
    "amount": 5000,
    "description": "Advance booking payment",
    "daysUntilExpiry": 7
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment request created successfully",
    "paymentRequest": {
      "_id": "ObjectId",
      "amount": 5000,
      "description": "Advance booking payment",
      "status": "pending",
      "razorpayOrderId": "order_id",
      "expiresAt": "2026-02-19T00:00:00Z",
      "key": "rzp_test_key",
      "bookingId": "booking_id"
    }
  }
  ```

##### 2. Get Payment Requests for Booking
**GET** `/api/bookings/:bookingId/payment-requests`
- **Description**: Get all payment requests for a specific booking
- **Response**:
  ```json
  {
    "success": true,
    "paymentRequests": [...],
    "bookingId": "booking_id",
    "customerEmail": "customer@example.com",
    "customerName": "Customer Name"
  }
  ```

##### 3. Verify Payment Request Payment
**POST** `/api/bookings/:bookingId/payment-request/verify`
- **Auth Required**: Yes (Bearer token)
- **Description**: Verify a payment request payment after Razorpay callback
- **Body Parameters**:
  ```json
  {
    "paymentRequestId": "request_id",
    "razorpayPaymentId": "pay_id",
    "razorpayOrderId": "order_id",
    "razorpaySignature": "signature"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment request verified and marked as paid",
    "paymentRequest": {...},
    "bookingPaymentStatus": "completed"
  }
  ```

##### 4. Get All Pending Payment Requests for Venue Owner
**GET** `/api/bookings/owner/pending-payments`
- **Auth Required**: Yes (Bearer token)
- **Description**: Get all bookings with pending payment requests for the venue owner
- **Response**: Array of bookings with payment requests

### 2. Frontend Features

#### Venue Owner Dashboard - Payment Requests Tab

**New Tab**: "💳 Payment Requests"

**Features**:
1. **View all bookings with pending payment requests**
   - Customer name and email
   - Event details (date, type, guest count)
   - Total event cost
   - List of all payment requests

2. **Create Payment Request from Booking**
   - Click "💳 Request Payment" button on any booking in Bookings tab
   - Enter payment amount
   - Add optional description
   - Set expiry days (1-30 days)
   - Payment request is created and visible in Payment Requests tab

3. **Track Payment Request Status**
   - Pending: Awaiting customer payment
   - Paid: Successfully received
   - Expired: Request has expired

#### Customer Dashboard - New Tabs

**1. Payment Requests Tab** (💳 Payment Requests)
- Shows all bookings with pending payment requests
- Displays:
  - Event details
  - Total booking cost
  - List of pending payment requests
  - Amount and expiry date for each request

**2. Pay Payment Request**
- Click "💳 Pay Now" button on any payment request
- Razorpay payment modal opens
- Complete payment securely
- After successful payment:
  - Payment status updates to "Paid"
  - Automatic verification happens
  - Success notification shown

## Usage Flow

### For Venue Owners

1. **Navigate to Venue Owner Dashboard**
   - Click "🏛️ Venue Owner Dashboard" in navigation

2. **View Bookings**
   - Go to "📅 Bookings" tab
   - Find the booking you want to request payment for

3. **Create Payment Request**
   - Click "💳 Request Payment" button
   - Enter amount (e.g., 5000 for advance, 10000 for final)
   - Add description (e.g., "Advance booking payment", "Final payment")
   - Set expiry period (e.g., 7 days)
   - Click "✅ Create Request"

4. **Track Payments**
   - Go to "💳 Payment Requests" tab
   - See all payment requests and their status
   - Monitor which customers have paid

### For Customers

1. **Check for Pending Payments**
   - Go to Customer Dashboard
   - Click "💳 Payment Requests" tab
   - See all pending payment requests

2. **Pay a Request**
   - Click "💳 Pay Now" on the request you want to pay
   - Razorpay payment modal appears
   - Enter card/wallet details
   - Complete payment
   - Wait for success confirmation

3. **View Payment History**
   - Return to Payment Requests tab
   - See updated status (Paid) for completed requests

## Database Schema Update

```javascript
paymentRequests: [{
  _id: mongoose.Schema.Types.ObjectId,
  amount: Number,
  description: String,
  status: { type: String, enum: ['pending', 'paid', 'expired'], default: 'pending' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
}]
```

## Security Features

1. **Signature Verification**: Every payment is verified using Razorpay signature
2. **Authentication**: All payment operations require valid JWT token
3. **Authorization**: 
   - Only venue owners can create payment requests for their bookings
   - Only customers of a booking can pay payment requests for that booking
4. **Amount Validation**: Payment amounts are validated before creating orders

## Razorpay Integration

### Key IDs Used
- **Key ID**: `rzp_test_NaH00L6fPmXM6G` (Test mode)
- **Key Secret**: `Dqn1m2Y4nLpY3D5xK7vZ0qA` (Test mode)

### Payment Flow
1. Frontend initiates payment request
2. Backend creates Razorpay order
3. Razorpay modal opens in frontend
4. Customer completes payment
5. Frontend gets payment response
6. Backend verifies signature
7. Backend updates booking payment status
8. Frontend shows success message

## Error Handling

### Common Errors

1. **"Invalid payment signature"**
   - Payment verification failed
   - Possible tampering or network issue
   - Ask customer to try again

2. **"Payment request not found"**
   - Request may have expired
   - Create a new payment request

3. **"Unauthorized - You must be the venue owner"**
   - Only venue owners can create payment requests
   - Check user role

4. **"Invalid payment amount"**
   - Amount must be greater than 0
   - Re-enter valid amount

## Testing Payment Requests

### Test Credentials (Razorpay Test Mode)

**Successful Payment Card**:
- Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits

**Failed Payment Card**:
- Card: 4111 1111 1111 1112
- Expiry: Any future date
- CVV: Any 3 digits

### Test Scenario

1. Create a booking as customer
2. Login as venue owner
3. Create payment request for that booking
4. Login as customer
5. Go to Payment Requests tab
6. Click "Pay Now"
7. Use test card to complete payment
8. Verify payment status updates to "Paid"

## API Summary Table

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings/:bookingId/payment-request` | Yes | Create payment request |
| GET | `/api/bookings/:bookingId/payment-requests` | No | Get payment requests |
| POST | `/api/bookings/:bookingId/payment-request/verify` | Yes | Verify payment |
| GET | `/api/bookings/owner/pending-payments` | Yes | Get pending payments |

## Files Modified

### Backend
- `models/Booking.js` - Added paymentRequests array schema
- `routes/bookingRoutes.js` - Added 4 new endpoints

### Frontend
- `pages/VenueOwnerDashboard.js` - Added Payment Requests tab
- `pages/CustomerDashboard.js` - Added Payment Requests tab and payment handler
- `public/index.html` - Already has Razorpay script

## Future Enhancements

1. **Payment Reminders**: Automatic email/SMS reminders before expiry
2. **Partial Payments**: Allow customers to make partial payments
3. **Payment History**: Detailed payment history and receipts
4. **Automatic Invoice**: Generate invoices for payments
5. **Refund Management**: Handle refunds for cancelled bookings
6. **Payment Analytics**: Dashboard showing payment statistics
7. **Multiple Payment Methods**: Support for other payment gateways
8. **Installment Plans**: Allow payments in multiple installments

## Support

For issues or questions about payment requests:
1. Check the error message
2. Verify Razorpay credentials are correct
3. Check network connectivity
4. Try with test card credentials first
5. Check browser console for detailed error messages
