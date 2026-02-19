# 🎉 Services & Booking System - Complete Guide

## ✨ Features Implemented

### 1. **Service Provider Dashboard** 🎯
Service providers can now manage their services with full CRUD functionality.

**Features:**
- ✅ Add new services (type, name, description, pricing, availability)
- ✅ Set service pricing (hourly + full event rates)
- ✅ Configure availability (days of week, time slots)
- ✅ Manage service locations
- ✅ View all your services in a card layout
- ✅ Edit services (interface ready)
- ✅ Delete services with confirmation
- ✅ Track approval status

**Service Types Available:**
- Catering
- Cultural Services
- Event Manager
- Decoration
- Priest Services
- Makeup

**Route:** `/manage-services` (for service_provider role)

---

### 2. **Venue Booking System** 📅
Customers can search for venues and book them with date/time availability checking.

**Features:**
- ✅ **Search Venues:**
  - Filter by location
  - Filter by minimum capacity
  - Filter by maximum price per day
  - Real-time search results

- ✅ **Availability Checking:**
  - Check if venue is available on specific date
  - Check time slot conflicts
  - Real-time availability verification
  - Prevents double-booking

- ✅ **Make Bookings:**
  - Select event date
  - Choose start and end time
  - Select event type (marriage, birthday, engagement, corporate, other)
  - Specify number of guests
  - Add special requests
  - Enter customer details (name, email, phone)
  - Automatic cost calculation
  - Booking confirmation with ID

**Route:** `/book-venue` (public, accessible without login)

---

## 📊 Database Schema Updates

### Booking Model Enhanced:
```javascript
{
  customer: ObjectId,           // Linked user
  venue: ObjectId,              // Linked venue
  services: [ObjectId],         // Array of service IDs
  eventDate: Date,              // Booking date
  eventStartTime: String,       // HH:MM format
  eventEndTime: String,         // HH:MM format
  eventType: String,            // Enum
  guestCount: Number,           // Number of guests
  totalCost: Number,            // Calculated cost
  status: String,               // pending/confirmed/completed/cancelled
  paymentStatus: String,        // pending/completed
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  specialRequests: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Service Model Enhanced:
```javascript
{
  provider: ObjectId,           // Service provider user
  type: String,                 // Service type
  name: String,                 // Service name
  description: String,
  images: [String],            // Base64 images
  pricing: {
    hourly: Number,            // Hourly rate
    fullEvent: Number          // Full event rate
  },
  availability: {
    daysOfWeek: [Number],      // 0-6 (Sun-Sat)
    startTime: String,         // HH:MM
    endTime: String            // HH:MM
  },
  serviceLocations: [String],
  ratings: Number,             // 0-5
  reviews: Array,
  isApproved: Boolean,         // Admin approval status
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 Backend API Endpoints

### Booking Endpoints:

#### 1. Check Availability
```
POST /api/bookings/check-availability
Body: {
  venueId: "...",
  eventDate: "2024-12-25",
  eventStartTime: "09:00",
  eventEndTime: "17:00"
}
Response: { available: true/false, venue: {...}, conflictingBookings: 0 }
```

#### 2. Create Booking
```
POST /api/bookings/
Headers: Authorization Bearer token
Body: {
  venueId: "...",
  eventDate: "2024-12-25",
  eventStartTime: "09:00",
  eventEndTime: "17:00",
  eventType: "marriage",
  guestCount: 100,
  customerName: "John Doe",
  customerEmail: "john@email.com",
  customerPhone: "9876543210",
  specialRequests: "..."
}
Response: { success: true, booking: {...} }
```

#### 3. Get User Bookings
```
GET /api/bookings/user/bookings
Headers: Authorization Bearer token
Response: [{ booking objects }]
```

#### 4. Get Booking Details
```
GET /api/bookings/:id
Response: { full booking details with populated references }
```

#### 5. Update Booking Status
```
PUT /api/bookings/:id/status
Headers: Authorization Bearer token
Body: { status: "pending|confirmed|completed|cancelled" }
Response: { success: true, booking: {...} }
```

#### 6. Cancel Booking
```
DELETE /api/bookings/:id
Headers: Authorization Bearer token
Response: { success: true, booking: {...} }
```

### Service Endpoints:

#### 1. Get All Services
```
GET /api/services/
Response: [{ service objects (approved only) }]
```

#### 2. Get Services by Type
```
GET /api/services/type/:type
Response: [{ filtered service objects }]
```

#### 3. Get Service Details
```
GET /api/services/:id
Response: { full service details with provider info }
```

#### 4. Create Service
```
POST /api/services/
Headers: Authorization Bearer token
Body: {
  type: "catering",
  name: "Premium Catering",
  description: "...",
  pricing: { hourly: 500, fullEvent: 5000 },
  serviceLocations: ["Mumbai", "Pune"],
  contactNumber: "9876543210",
  availability: {
    daysOfWeek: [1,2,3,4,5],
    startTime: "09:00",
    endTime: "21:00"
  }
}
Response: { success: true, service: {...} }
```

#### 5. Update Service
```
PUT /api/services/:id
Headers: Authorization Bearer token
Body: { field updates }
Response: { success: true, service: {...} }
```

#### 6. Delete Service
```
DELETE /api/services/:id
Headers: Authorization Bearer token
Response: { success: true }
```

---

## 🎨 Frontend Components

### VenueBooking Component
- **Path:** `frontend/src/pages/VenueBooking.js`
- **CSS:** `frontend/src/pages/VenueBooking.css`
- **Features:**
  - Search and filter venues
  - Modal booking form
  - Availability checking
  - Cost summary
  - Customer details form
  - Real-time validation

### ServiceProviderDashboard Component
- **Path:** `frontend/src/pages/ServiceProviderDashboard.js`
- **CSS:** `frontend/src/pages/ServiceProviderDashboard.css`
- **Features:**
  - Add service form
  - Service listing with cards
  - Edit/Delete functionality
  - Day of week selector
  - Time slot configuration
  - Pricing management

---

## 🧪 Testing the Features

### Test Booking Flow:
1. **Register as Customer** → `/register` (select "Customer" role)
2. **Login** → `/login`
3. **Go to Book Venue** → `/book-venue`
4. **Search Venues:**
   - Use filters to find venues
   - Click "📅 Book Now" on a venue
5. **Fill Booking Form:**
   - Select date and time
   - Click "⚡ Check Availability"
   - Should show ✅ or ❌ status
   - Fill remaining details
   - Click "✅ Confirm Booking"
6. **Confirm Booking** → Should show success with Booking ID

### Test Service Management:
1. **Register as Service Provider** → `/register` (select "Service Provider" role)
2. **Login** → `/login`
3. **Go to Services Dashboard** → `/manage-services`
4. **Add Service:**
   - Click "➕ Add New Service"
   - Fill in all details
   - Select available days
   - Set time slots
   - Click "✅ Add Service"
5. **Manage Services:**
   - View service cards
   - Click "✏️ Edit" (interface ready)
   - Click "🗑️ Delete"

---

## 🔐 Security Features

✅ **Authentication Required for:**
- Creating bookings
- Viewing user bookings
- Managing services
- Updating/deleting services

✅ **Validation:**
- Guest count vs venue capacity
- Time slot conflict checking
- Required field validation
- Email format validation
- Date/time validation

✅ **Authorization:**
- Only service providers can create services
- Only booking owner can cancel
- Only service provider can delete their service
- Admin approval workflow for services

---

## 📱 Navigation Updates

**Navbar Links Added:**
- `📅 Book Venue` - Available to all (public)
- `🎯 Services` - Shows for service_provider role only (linked to `/manage-services`)

**Route Structure:**
```
/book-venue                    → VenueBooking (public)
/manage-services               → ServiceProviderDashboard (protected: service_provider)
/dashboard                     → Role-based dashboard
  → Customer Dashboard
  → Venue Owner Dashboard
  → Service Provider Dashboard
```

---

## 🚀 Quick Start Guide

### For Customers:
1. Go to `/book-venue`
2. Use filters to search venues
3. Click "📅 Book Now" on your favorite venue
4. Select date and time, check availability
5. Fill details and confirm booking

### For Service Providers:
1. Go to `/manage-services` (after login)
2. Click "➕ Add New Service"
3. Fill service details
4. Configure availability (days & times)
5. Set pricing (hourly + full event)
6. Submit and wait for admin approval

### For Venue Owners:
1. Continue to `/dashboard` after login
2. Add venues with images and details
3. View and manage bookings in booking list

---

## ⚙️ Configuration

### Available Env Variables:
```
REACT_APP_API_URL=http://localhost:5000
STRIPE_SECRET_KEY=test (for future payment integration)
```

### Service Types:
- `catering` - Catering services
- `cultural` - Cultural programs
- `event_manager` - Event management
- `decoration` - Venue decoration
- `priest` - Religious services
- `makeup` - Makeup services

### Event Types:
- `marriage` - Wedding events
- `birthday` - Birthday celebrations
- `engagement` - Engagement ceremonies
- `corporate` - Corporate events
- `other` - Other events

### Booking Status:
- `pending` - New booking, awaiting confirmation
- `confirmed` - Confirmed by venue owner
- `completed` - Event completed
- `cancelled` - Booking cancelled

---

## 📋 Future Enhancements

- [ ] Implement edit service functionality in UI
- [ ] Add service provider to booking (select multiple services)
- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] Email notifications for bookings
- [ ] SMS notifications
- [ ] Review and rating system for venues/services
- [ ] Invoice generation
- [ ] Cancellation policies
- [ ] Insurance options
- [ ] Vendor management dashboard (admin)
- [ ] Analytics and reporting
- [ ] Mobile app version

---

## 🆘 Troubleshooting

**Issue: "Time slot not available"**
- Solution: Check if another booking exists for that time
- Try different time slots
- Check availability calendar

**Issue: "Venue capacity exceeded"**
- Solution: Choose a venue with higher capacity
- Reduce guest count
- Look for larger halls

**Issue: "Service not appearing"**
- Solution: Service needs admin approval
- Check if service is approved in admin panel
- Ensure service provider is verified

**Issue: Availability check not working**
- Solution: Ensure date is in YYYY-MM-DD format
- Ensure time is in HH:MM format
- Check backend logs for errors

---

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Check backend server logs
3. Verify all fields are filled correctly
4. Ensure date is in future (not past)
5. Contact admin for approval-related issues

---

**Version:** 1.0.0 - Services & Booking System
**Last Updated:** February 10, 2026
**Status:** ✅ Complete and Ready for Testing

