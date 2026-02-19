# Services Feature Testing Guide

## Overview
This guide walks through testing the complete services functionality - from creation by service providers to browsing by customers.

## Prerequisites
- Backend server running on port 5000
- Frontend running on port 3000
- MongoDB connected and running
- User accounts created for testing

## Test Scenario: Create and Browse Services

### Step 1: Create a Service Provider Account
1. Go to: `http://localhost:3000/register`
2. Fill in the form:
   - **Name:** John's Catering
   - **Email:** catering@example.com
   - **Mobile:** 9876543210
   - **Password:** provider123
   - **Role:** Service Provider
   - **Location:** Mumbai
3. Click Register
4. Expected: Confirmation message "Registration successful"

### Step 2: Create a Service
1. Login with the service provider account (email: catering@example.com, password: provider123)
2. Navigate to: Service Provider Dashboard
3. Click "Add New Service" button
4. Fill in service details:
   - **Service Name:** Premium Vegetarian Catering
   - **Type:** Catering
   - **Description:** We offer premium vegetarian cuisine for weddings and events
   - **Pricing:**
     - Hourly: ₹5000
     - Full Event: ₹50000
   - **Available Locations:** Mumbai, Pune, Thane
   - **Contact Number:** 9876543210
   - **Service Hours:** 09:00 AM to 09:00 PM
   - **Available Days:** Monday to Sunday
5. Click "Create Service"
6. Expected: Success message "Service added successfully and is now visible to customers!"

### Step 3: Verify Service is Auto-Approved (Development Mode)
- Services are now auto-approved by default for development
- No admin approval needed
- Services appear immediately in customer listings

### Step 4: Create a Customer Account
1. Go to: `http://localhost:3000/register`
2. Fill in the form:
   - **Name:** Alice Johnson
   - **Email:** customer@example.com
   - **Mobile:** 9123456789
   - **Password:** customer123
   - **Role:** Customer
3. Click Register
4. Expected: Confirmation message "Registration successful"

### Step 5: Browse Services as Customer
1. Login with customer account (email: customer@example.com, password: customer123)
2. Navigate to: `/services` (or click "Browse Services" from navbar)
3. Expected behaviors:
   - ✅ Page loads with "Add Services to Your Event" heading
   - ✅ Service type dropdown shows options: Catering, Culturals, Event Managers, Decorations, Priests, Makeup Artists
   - ✅ "Catering" is selected by default
   - ✅ Services auto-load when page opens (no need to click Search)
   - ✅ The "Premium Vegetarian Catering" service appears in the grid
   - ✅ Service card displays:
     - Service name
     - Service type
     - Description
     - Rating (0/5 if new)
     - Pricing information (both hourly and full event)
     - Available locations (Mumbai, Pune, Thane)
     - Contact number

### Step 6: Test Service Type Filtering
1. Change dropdown to "Culturals / Dance Teams"
2. Expected: Page auto-loads services of "cultural" type (if any exist)
3. Change dropdown to "Decorations"
4. Expected: Page shows decoration services (if any exist)
5. Change back to "Catering"
6. Expected: The "Premium Vegetarian Catering" service appears again

### Step 7: Test Add Service Button
1. While on Services page with catering services displayed
2. Click "➕ Add Service" button on any service card
3. Expected:
   - Service ID is added to selected services list
   - "✅ Selected Services" section appears at bottom
   - Count updates (e.g., "✅ Selected Services: 1")
   - "💳 Proceed to Checkout" button appears

### Step 8: Test Loading State
1. On Services page, quickly change service type dropdown multiple times
2. Expected:
   - Search button shows "⏳ Loading..." while fetching
   - Button is disabled during loading
   - Prevents multiple concurrent requests

## Expected API Calls (Browser Network Tab)

### When service is created:
```
POST http://localhost:5000/api/services
{
  "type": "catering",
  "name": "Premium Vegetarian Catering",
  "description": "We offer premium vegetarian cuisine...",
  "pricing": { "hourly": 5000, "fullEvent": 50000 },
  "serviceLocations": ["Mumbai", "Pune", "Thane"],
  "contactNumber": "9876543210"
}
Response: 201 Created with service object
```

### When services are browsed:
```
GET http://localhost:5000/api/services/type/catering
Response: 200 OK with array of approved services
[
  {
    "_id": "...",
    "name": "Premium Vegetarian Catering",
    "type": "catering",
    "provider": { "name": "John's Catering", ... },
    "pricing": { "hourly": 5000, "fullEvent": 50000 },
    "isApproved": true,
    ...
  }
]
```

## Troubleshooting

### Services Not Showing
1. Check browser console for errors
2. Verify backend has payment routes registered:
   - `curl http://localhost:5000/` should show endpoints including `/api/services`
3. Check if MongoDB has service data:
   - Open MongoDB Compass
   - Navigate to: event-planning → services collection
   - Verify service documents exist with `isApproved: true`

### Service Type Not Matching
- Verify service type in database matches frontend dropdown:
  - Valid types: catering, cultural, decoration, event_manager, priest, makeup, photography, music, guest_handler

### Admin Service Approval (Future - Production Mode)
When `isApproved` is changed to `false` by default in production:
1. Services created by providers won't show to customers initially
2. Admin logs in and navigates to admin panel
3. Admin approves services via:
   - `PATCH /api/services/{serviceId}/approve` with `{ "isApproved": true }`
4. After approval, services appear in customer listings

## Success Criteria Checklist
- [ ] Service provider can create services
- [ ] Services are visible to all customers immediately (dev mode)
- [ ] Services are filtered correctly by type
- [ ] Service cards display all required information
- [ ] Service type filtering works properly
- [ ] Loading states display correctly
- [ ] Selected services counter updates
- [ ] No console errors during browsing
- [ ] API calls successful (check Network tab)

## Notes for Development
- `isApproved` defaults to `true` for development convenience
- Change in Service.js model: `isApproved: { type: Boolean, default: true }`
- For production, set to `false` and implement admin approval panel
- Admin endpoints already implemented:
  - `PATCH /api/services/{id}/approve` - Approve/reject service
  - `GET /api/services/admin/pending` - List pending approvals

## Next Steps
1. Test complete booking flow with services
2. Test service integration with venue booking
3. Test payment processing with selected services
4. Implement service reviews and ratings
