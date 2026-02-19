# 🏛️ Venue Owner Guide - How to Add Venues

## Quick Start

### Step 1: Login as Venue Owner
1. Go to `http://localhost:3000/register`
2. Fill registration form:
   - Role: **Select "Venue Owner"**
   - Location: Your city/area
3. Click "Create Account"
4. You're now logged in as Venue Owner ✅

### Step 2: Access Venue Dashboard
1. Click "Dashboard" in navigation
2. You'll see "Manage Your Venues" page
3. Click **"➕ Add New Venue"** button

---

## 📝 Adding a Venue - Step by Step

### Section 1: Basic Information

**Venue Name** *required*
- Example: "Grand Palace Banquet Hall"
- This is the name customers will see

**Location** *required*
- Example: "Mumbai", "Bandra", "Andheri"
- Cities and areas where you operate

**Seating Capacity** *required*
- Example: 500
- How many guests can your venue accommodate?

**Price per Day/Event** *required*
- Example: 50000
- Venue rental cost in ₹

**Description** (optional)
- Add details about your venue
- Example: "Elegant banquet hall with modern decor, air-conditioned, perfect for weddings and corporate events"

### Section 2: Facilities & Services

**Facilities** (optional, comma-separated)
- Separate multiple facilities with commas
- Examples:
  - Parking
  - WiFi
  - Air Conditioning
  - Projector
  - Sound System
  - Catering Kitchen
  - Washrooms
  - Stage

**Catering Options** (optional, comma-separated)
- What types of food can be served?
- Examples:
  - Vegetarian
  - Non-Vegetarian
  - Vegan
  - Jain
  - Continental
  - Desserts

### Section 3: Upload Images 🖼️

**Upload venue photos** *required - at least 1*

✅ **Best Practices:**
- Take clear, well-lit photos
- Show entrance, main hall, stage, and kitchen
- Include outdoor area if available
- Multiple angles of main venue
- Show decorations or sample setup

**Supported Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

**Image Tips:**
- Minimum 500x500 pixels
- Maximum 5MB per image
- Portrait or landscape both OK
- Professional photos recommended

**How to Upload:**
1. Click "Click to select images" button
2. OR drag & drop images into the area
3. Select multiple images at once
4. Preview shows all selected images
5. Click ❌ to remove any image

---

## ✅ Complete Form & Submit

After filling all sections:
1. Review all information
2. Ensure all required fields are filled (marked with *)
3. At least one image uploaded
4. Click **"✅ Add Venue"** button
5. Wait for confirmation message

**You'll see:**
- ✅ "Venue added successfully!" message
- Form will clear
- New venue appears in "Your Venues" list

---

## 📋 Your Venues List

Once venues are added, they appear in the list showing:

**For Each Venue:**
- 🖼️ Main image/photo
- 📝 Venue name
- 📍 Location
- 👥 Seating capacity
- 💰 Price per day
- 📝 Description
- 🏢 Facilities (as tags)
- 🍽️ Catering options (as tags)
- 🖼️ Total photos uploaded
- ⭐ Current rating

**Actions Available:**
- ✏️ Edit - Modify venue details
- 🗑️ Delete - Remove venue

---

## 📊 Venue Data Saved in MongoDB

When you add a venue, this data is stored:

```json
{
  "_id": "ObjectId (auto-generated)",
  "owner": "Your User ID",
  "name": "Venue Name",
  "location": "City",
  "capacity": 500,
  "pricePerDay": 50000,
  "description": "Venue description",
  "images": ["base64_image_1", "base64_image_2"],
  "facilities": ["Parking", "WiFi", "AC"],
  "cateringOptions": ["Vegetarian", "Non-Vegetarian"],
  "ratings": 0,
  "reviews": [],
  "isApproved": false,
  "createdAt": "2026-02-10T10:30:00Z",
  "updatedAt": "2026-02-10T10:30:00Z"
}
```

**Note:** `isApproved: false` means admin needs to approve before customers see it.

---

## 🔑 Key Features

### ✅ What You Can Do:
- ✅ Add unlimited venues
- ✅ Upload multiple images per venue
- ✅ Add detailed descriptions
- ✅ Specify facilities and catering options
- ✅ Edit venue information
- ✅ Delete venues
- ✅ View all your venues
- ✅ Track venue ratings

### ⏳ Coming Soon:
- 📅 Availability calendar
- 📊 Booking analytics
- 💬 Customer reviews
- 📞 Inquiry management
- 📈 Performance metrics

---

## ❌ Common Issues & Solutions

### Issue: "Please fill all required fields"
**Solution:** Check that you've entered:
- Venue Name ✅
- Location ✅
- Capacity (number) ✅
- Price per Day (number) ✅
- At least 1 image ✅

### Issue: "Please upload at least one image"
**Solution:** Click the upload area and select images

### Issue: Form not submitting
**Solution:** 
- Check internet connection
- Ensure backend is running (`npm run dev` in backend folder)
- Try refreshing the page
- Clear browser cache

### Issue: Images not showing in preview
**Solution:**
- Check file format (must be JPG/PNG/WebP)
- Check file size (under 5MB)
- Try different images
- Refresh page

### Issue: "Only venue owner can update"
**Solution:** You can only edit your own venues. Make sure you're logged in as the venue owner.

---

## 📱 Frontend Flow

```
Login as Venue Owner
        ↓
Go to Dashboard
        ↓
Click "Add New Venue"
        ↓
Fill Form:
  - Basic info (name, location, capacity, price)
  - Description
  - Facilities & Catering
        ↓
Upload Images
        ↓
Click "Add Venue"
        ↓
Venue saved to MongoDB ✅
        ↓
Appears in "Your Venues" list
        ↓
Admin approves
        ↓
Customers can see & book 🎉
```

---

## 🔐 Logout

Click **"🚪 Logout"** button in navigation to:
- Clear all session data
- Remove token from browser
- Redirect to home page
- Completely logged out

---

## 📞 Support

If you encounter any issues:
1. Check this guide
2. Review error messages
3. Check MongoDB connection (backend running?)
4. Clear browser cache and try again
5. Contact admin

---

## ✨ Best Practices

### For Venue Details:
✅ Use clear, descriptive names
✅ Be specific about location (area/landmark)
✅ List all available facilities
✅ Specify catering options clearly
✅ Write detailed descriptions
✅ Upload high-quality photos
✅ Show different areas of venue
✅ Keep information updated

### For Images:
✅ Multiple angles of main hall
✅ Entrance/reception area
✅ Stage/platform area
✅ Catering/kitchen area
✅ Outdoor areas
✅ Restrooms
✅ Parking area
✅ Decorated setup example

### For Pricing:
✅ Include all major costs
✅ Be competitive
✅ List any inclusions
✅ Specify what's extra
✅ Update seasonally

---

**Venue Owner Portal is Ready! Start Adding Your Venues Today! 🎉**
