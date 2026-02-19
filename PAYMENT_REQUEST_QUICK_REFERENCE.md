# 💳 Payment Request Feature - Quick Start Guide

## What's New?

You can now request payments from customers directly for their bookings through Razorpay! This allows flexible payment collection instead of full upfront payment.

## Key Features

✅ Venue owners can create payment requests for any booking
✅ Customers see pending payment requests in their dashboard
✅ One-click payment through Razorpay
✅ Automatic payment verification
✅ Payment expiry tracking
✅ Complete audit trail of all payments

## For Venue Owners

### How to Request Payment

1. Go to **🏛️ Venue Owner Dashboard**
2. Click on **📅 Bookings** tab
3. Find the booking you want to collect payment for
4. Click **💳 Request Payment** button
5. Fill in:
   - **Amount**: ₹ amount you want to request
   - **Description**: What is this payment for (optional)
   - **Days Until Expiry**: How many days to wait before request expires (1-30)
6. Click **✅ Create Request**
7. Go to **💳 Payment Requests** tab to track status

### Payment Request Statuses

- 🟡 **Pending** - Waiting for customer payment
- ✅ **Paid** - Customer has paid successfully
- ❌ **Expired** - Request has expired without payment

### You Can Request Multiple Payments

Example:
- Request ₹5,000 as advance (expires in 3 days)
- Request ₹15,000 as final payment (expires in 7 days)
- Request ₹2,000 for decorations (expires in 5 days)

All shown in Payment Requests tab with individual status tracking.

## For Customers

### View Payment Requests

1. Go to **Customer Dashboard**
2. Click on **💳 Payment Requests** tab
3. See all bookings with pending payments
4. Each request shows:
   - Amount to pay
   - Description from venue owner
   - Expiry date
   - Booking details

### Pay a Request

1. Click **💳 Pay Now** button on the request
2. Razorpay payment window opens
3. Enter payment details:
   - Card/Wallet details
   - Confirm amount
4. Payment processes securely
5. Get confirmation: ✅ Payment successful!
6. Status updates to **Paid** automatically

### That's It!

Your booking is one step closer to confirmation once all payment requests are paid.

## Payment Flow Diagram

```
┌─────────────────────────────────────┐
│  Venue Owner Creates Payment Request│
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Request Appears in Customer         │
│  Dashboard Payment Requests Tab       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Customer Clicks 'Pay Now'           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Razorpay Payment Modal Opens       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Payment Processed Securely          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Payment Verified                   │
│  Status: PAID ✅                    │
└─────────────────────────────────────┘
```

## Test the Feature

### Using Test Account

1. **Venue Owner Steps**:
   - Book a venue as a customer first
   - Switch to venue owner account
   - Go to bookings and create a payment request
   - Enter test amount (e.g., ₹100)

2. **Customer Payment Steps**:
   - Switch back to customer account
   - Go to Payment Requests tab
   - Click 'Pay Now'
   - Use Razorpay test card:
     - **Card Number**: 4111 1111 1111 1111
     - **Expiry**: Any future date (e.g., 12/25)
     - **CVV**: Any 3 digits
   - Complete payment
   - See "Payment successful!" message

## Common Scenarios

### Scenario 1: Multi-Stage Payment

**Booking Cost**: ₹50,000

**Payment Plan**:
- Day 1: Request ₹10,000 (30% advance) - expires in 3 days
- Day 4: Request ₹20,000 (40% intermediate) - expires in 14 days
- Day 10: Request ₹20,000 (40% final) - expires in 7 days before event

Customer gets notifications and can pay step by step!

### Scenario 2: Quick Payment

**Booking Cost**: ₹25,000

**Payment Plan**:
- Request full ₹25,000 immediately - expires in 7 days

Customer pays once and booking is confirmed!

### Scenario 3: Service-Based Payment

**Booking Cost**: ₹50,000 (Venue ₹30,000 + Services ₹20,000)

**Payment Plan**:
- Venue owner requests ₹30,000 for venue
- Service provider requests ₹20,000 for services
- Both requests visible to customer
- Customer can pay both

## Key Advantages

| For Venue Owners | For Customers |
|------------------|---------------|
| Flexible payment collection | Transparent payment requests |
| Multiple payment requests per booking | Know exactly when/what to pay |
| Track payment status in real-time | Multiple payment options |
| Automatic payment verification | Secure Razorpay payment |
| Payment reminders (coming soon) | Payment history |

## Troubleshooting

### "Payment verification failed"
- Check internet connection
- The payment may still go through - refresh after 5 minutes
- Contact support if issue persists

### "Payment request not found"
- Request may have expired
- Ask venue owner to create a new request

### "Invalid payment amount"
- Amount must be greater than ₹0
- Check the amount you entered

### Payment appeared twice
- Check payment history carefully
- Razorpay shows status, you'll only be charged once
- Contact support with transaction ID if needed

## Tips & Best Practices

### For Venue Owners
✅ Set reasonable expiry dates (5-7 days recommended)
✅ Request payment soon after booking confirmation
✅ Use clear descriptions (e.g., "Advance booking", "Final payment")
✅ Create multiple smaller requests if booking is high value
✅ Check Payment Requests tab weekly to track collections

### For Customers
✅ Check Payment Requests tab regularly
✅ Pay before expiry date to avoid reminders
✅ Keep payment confirmation for records
✅ Contact venue owner if payment fails
✅ Bookmark customer dashboard for quick access

## Next Steps

1. **Venue Owner**: Create your first payment request today
2. **Customer**: Check Payment Requests tab regularly
3. **Both**: Enjoy seamless, transparent payment process!

---

Need help? Check the full documentation at `PAYMENT_REQUEST_GUIDE.md`
