# Browsing & Filtering Quick Reference

## Services Page (/services)

### Available Filters
| Filter | Type | Behavior |
|--------|------|----------|
| **Service Type** | Dropdown | Catering, Cultural, Event Manager, Decoration, Priest, Makeup |
| **Location** | Dropdown | Auto-populated from available locations in loaded services |
| **Event Date** | Date Picker | Shows services available on selected day of week |

### Key Features
- ✅ Auto-loads services when page opens
- ✅ Services auto-update when type changes
- ✅ Real-time filtering on location/date change
- ✅ Shows "Found X matching services" count
- ✅ Clear Filters button appears when filters active
- ✅ Responsive design: mobile, tablet, desktop

### Availability Check
Service shows if:
- Selected location in service's `serviceLocations` array
- Selected date's day-of-week in service's `availability.daysOfWeek`

---

## Venue Search Page (/venues)

### Available Filters
| Filter | Type | Behavior |
|--------|------|----------|
| **Location** | Text Input | Flexible search: city, area, pincode |
| **Min Capacity** | Number | Shows venues with capacity ≥ entered number |
| **Max Price** | Number | Shows venues with price/day ≤ entered amount |
| **Event Date** | Date Picker | Shows venues available on selected date |

### Key Features
- ✅ Auto-loads all venues on page open
- ✅ Real-time filtering as user types/selects
- ✅ Shows "Showing X venues matching your criteria"
- ✅ Clear All Filters button for quick reset
- ✅ Helpful empty state messages
- ✅ Mobile optimized: single column layout

### Availability Check
Venue shows if:
- Location text matches venue location
- Capacity ≥ minimum required
- Price/day ≤ maximum budget
- Selected date in venue's `availableDates` array

---

## Real-Time Filtering Flow

### Services
```
Page Load
  ↓
Load all catering services
  ↓
Show location dropdown
  ↓
User selects location → Auto-filter
User selects date → Auto-filter
User picks both → Filter by BOTH (AND condition)
User clears → Show all matching type
```

### Venues
```
Page Load
  ↓
Load all venues
  ↓
Show all venues
  ↓
User enters location → Auto-filter
User enters capacity → Auto-filter
User enters price → Auto-filter
User enters date → Auto-filter
Clears any → Instantly recalculate
```

---

## Common Use Cases

### Case 1: Find Catering in Mumbai
1. Go to /services
2. Leave type as "Catering" (default)
3. Select location "Mumbai" from dropdown
4. See: "Found 8 matching services in Mumbai"

### Case 2: Find Venue for Big Wedding
1. Go to /venues
2. Enter "Mumbai" in location
3. Enter "500" in minimum capacity
4. Leave price empty (see all)
5. See: "Showing 6 venues" - all 500+ capacity in Mumbai

### Case 3: Budget Venue on Specific Date
1. Go to /venues
2. Leave location empty
3. Enter "30000" in max price
4. Enter "2026-02-14" in event date
5. See: "Showing 12 venues" - budget options on that date

### Case 4: Makeup Artist Available on Sunday
1. Go to /services
2. Select type "Makeup Artists"
3. Select location "Bandra"
4. Select a Sunday date
5. See: All makeup artists in Bandra available on Sundays

---

## Data Structures

### Service Filtering Requirements
```javascript
Service {
  name: "Premium Catering",
  type: "catering",
  serviceLocations: ["Mumbai", "Pune", "Thane"],
  availability: {
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],  // All days
    startTime: "09:00",
    endTime: "21:00"
  }
}
```

### Venue Filtering Requirements
```javascript
Venue {
  name: "Grand Ballroom",
  location: "Mumbai, Bandra",
  capacity: 500,
  pricePerDay: 45000,
  availableDates: ["2026-02-14", "2026-02-15", "2026-02-16"]
}
```

---

## Day of Week Reference
Used for service availability filtering:
- **0** = Sunday
- **1** = Monday
- **2** = Tuesday
- **3** = Wednesday
- **4** = Thursday
- **5** = Friday
- **6** = Saturday

Example: Service available [1,2,3,4,5] = Mon-Fri only

---

## Browser Support
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ✅ IE 11+ (with polyfills)

---

## Performance Notes
- All filtering is **client-side** (no API calls for filters)
- **Instant results** - no delay
- **Works offline** after initial page load
- Tested with **500+ services/venues**

---

## Responsive Breakpoints

| Device | Breakpoint | Layout |
|--------|-----------|--------|
| Desktop | > 768px | Multi-column filter grid |
| Tablet | 481-768px | Single column filters |
| Mobile | ≤ 480px | Full width inputs, optimized spacing |

---

## Tips & Tricks

### Find Hidden Gems
- Filter by date first (less common)
- Then by location
- Then by budget/capacity

### Bulk Search
- Leave filters empty to see all options
- Use only location filter for broad search
- Add date/capacity/price for refinement

### Save Favorites
- Bookmark URLs with filters applied
- Example: `/venues?location=Mumbai` (future feature)

### Expert Filtering
1. Set capacity filter to exact needs
2. Set price filter to maximum budget
3. Pick specific date for best availability
4. See maximum matching options

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No locations in dropdown | No services loaded or no locations in data |
| Filters not responding | Refresh browser, check console for errors |
| Very few results | Filters too restrictive, try clearing some |
| Date picker not working | Use MM/DD/YYYY format, set today as minimum |
| Mobile view broken | Clear browser cache, hard refresh |

---

## Future Enhancements Coming Soon
- 🔄 Sort by: Price, Rating, Distance
- ⭐ Filter by: Ratings (4+ stars only)
- 🏢 Filter by: Amenities (AC, Parking, WiFi)
- 💾 Save: Filter combinations
- 📍 Map: Show venue locations on map
- 📱 Advanced: Multi-location search

---

**Last Updated:** February 13, 2026
**Status:** ✅ LIVE & TESTED
