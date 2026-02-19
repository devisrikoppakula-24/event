# Frontend Components Integration Guide

## Overview
This guide explains how to integrate the newly created frontend components for Reviews, Chat, and AI Recommendations into your event planning platform.

## New Components Created

### 1. Review Components (for Service & Venue Details)
- **ReviewForm.js** - Submit new reviews with star ratings (service/venue specific)
- **ReviewList.js** - Display reviews with rating breakdown statistics
- **ReviewForm.css** - Styling for review form
- **ReviewList.css** - Styling for review list

### 2. Chat Components (Messaging System)
- **ChatInterface.js** - Displays messages and message input
- **ConversationList.js** - Lists all user conversations with unread counts
- **ChatPage.js** - Full chat page layout with sidebar
- **ChatInterface.css** - Styling for chat messages
- **ConversationList.css** - Styling for conversation list
- **ChatPage.css** - Styling for full chat layout

### 3. Recommendation Components (AI-Powered Suggestions)
- **RecommendationCard.js** - Individual recommendation card with score and reasons
- **RecommendationList.js** - Grid of recommendations with loading/empty states
- **RecommendationsPage.js** - Full page with filters and tabs for venues/services/personalized
- **RecommendationCard.css** - Card styling
- **RecommendationList.css** - Grid and layout styling
- **RecommendationsPage.css** - Page styling

## Integration Steps

### Step 1: Update Your App.js Routes

Add these routes to your main App.js file (after your existing routes):

```javascript
// Add React Router import if not already present
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import new components
import ChatPage from './pages/ChatPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ReviewForm from './components/ReviewForm';
import ReviewList from './components/ReviewList';

// Inside your <Routes> component, add:
<Route path="/messages" element={<ChatPage />} />
<Route path="/recommendations" element={<RecommendationsPage />} />
```

### Step 2: Add Navigation Links

Update your Navbar.js to include links to new features:

```javascript
// Inside your navbar/navigation component, add:
<Link to="/messages">💬 Messages</Link>
<Link to="/recommendations">🎯 Recommendations</Link>
```

### Step 3: Integrate Reviews into Service/Venue Detail Pages

In your **Service Detail** page (e.g., ServiceDetail.js):

```javascript
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';

function ServiceDetail() {
  const serviceId = '...'; // Get from URL params
  
  return (
    <div>
      {/* Existing service details */}
      
      {/* Reviews Section */}
      <div className="reviews-section">
        <ReviewForm serviceId={serviceId} />
        <ReviewList serviceId={serviceId} />
      </div>
    </div>
  );
}
```

Similarly for **Venue Detail** page:

```javascript
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';

function VenueDetail() {
  const venueId = '...'; // Get from URL params
  
  return (
    <div>
      {/* Existing venue details */}
      
      {/* Reviews Section */}
      <div className="reviews-section">
        <ReviewForm venueId={venueId} />
        <ReviewList venueId={venueId} />
      </div>
    </div>
  );
}
```

### Step 4: Add Message Badge to Navbar

In your **Navbar.js**, add unread message count:

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5000/api/messages/user/unread-count',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUnreadCount(response.data.totalUnread || 0);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();
    // Check for new messages every 5 seconds
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav>
      {/* Existing navbar */}
      <Link to="/messages" className="message-link">
        💬 Messages
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </Link>
    </nav>
  );
}
```

### Step 5: Optional - Add Chat Button to Service/Venue Cards

In your service or venue listing components:

```javascript
import { useNavigate } from 'react-router-dom';

function ServiceCard({ service }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const handleContact = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/messages/direct/${service.providerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/messages');
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  return (
    <div className="service-card">
      {/* Service details */}
      <button onClick={handleContact}>📧 Contact Provider</button>
    </div>
  );
}
```

## API Endpoints Reference

### Review Endpoints
- `POST /api/reviews/service/:serviceId` - Submit service review
- `POST /api/reviews/venue/:venueId` - Submit venue review
- `GET /api/reviews/service/:serviceId` - Get service reviews & stats
- `GET /api/reviews/venue/:venueId` - Get venue reviews & stats
- `POST /api/reviews/:reviewId/helpful` - Mark review as helpful
- `DELETE /api/reviews/:reviewId` - Delete review

### Message Endpoints
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/:conversationId` - Get messages in conversation
- `GET /api/messages/user/conversations` - Get all user conversations
- `GET /api/messages/direct/:userId` - Get or create direct conversation
- `PUT /api/messages/:conversationId/read` - Mark conversation as read
- `DELETE /api/messages/:messageId` - Delete message
- `GET /api/messages/user/unread-count` - Get unread message count

### Recommendation Endpoints
- `POST /api/recommendations/venues` - Get venue recommendations by criteria
- `POST /api/recommendations/services` - Get service recommendations by criteria
- `GET /api/recommendations/personalized` - Get recommendations based on booking history

## Component Props

### ReviewForm
```javascript
<ReviewForm 
  serviceId={string}  // Required if submitting service review
  venueId={string}    // Required if submitting venue review
  onReviewSubmitted={function} // Callback when review is submitted
/>
```

### ReviewList
```javascript
<ReviewList 
  serviceId={string}  // Show reviews for this service
  venueId={string}    // Show reviews for this venue
/>
```

### ChatInterface
```javascript
<ChatInterface 
  conversationId={string}  // Required
  recipientName={string}   // Display recipient name
  recipientRole={string}   // Display recipient role
  recipientId={string}     // Required for sending messages
/>
```

### ConversationList
```javascript
<ConversationList 
  onSelectConversation={function} // Called when conversation is selected
/>
```

### RecommendationList
```javascript
<RecommendationList 
  type={'venues'|'services'|'personalized'} // Type of recommendations
  filters={object}  // Filter criteria
  onViewDetails={function} // Navigate to detail page
/>
```

### RecommendationCard
```javascript
<RecommendationCard 
  recommendation={object}  // Recommendation data
  type={'venue'|'service'} // Type
  onBook={function}        // Handle booking/inquiry
  onLearnMore={function}   // View details
/>
```

## Styling Integration

All components include responsive CSS with breakpoints for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

The components use a consistent design system with:
- Primary color: `#667eea` (purple gradient)
- Accent color: `#4CAF50` (green for success)
- Background: `#f8f9fa`
- Typography: Segoe UI, Tahoma, Geneva, Verdana

## Important Notes

### Authentication
All components expect the following in localStorage:
- `token` - JWT authentication token
- `userId` - Current user's ID
- `userName` - Current user's name

Make sure these are set after login.

### Real-Time Updates
- Chat messages refresh every 2 seconds
- Conversations list refreshes every 3 seconds
- Unread counts refresh every 5 seconds

For truly real-time features, consider implementing Socket.IO (see "Future Enhancements" below).

### Error Handling
All components include error states and display user-friendly messages.

## Future Enhancements

### 1. Socket.IO for Real-Time Chat
Install packages:
```bash
npm install socket.io-client
npm install socket.io --save-dev (backend)
```

Setup WebSocket connection in ChatInterface:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');
socket.on('message', (data) => {
  // Handle real-time message
});
```

### 2. Image Upload for Reviews
```javascript
<input type="file" accept="image/*" multiple onChange={handleImageUpload} />
```

### 3. Typing Indicators
```javascript
socket.emit('typing', { conversationId, isTyping: true });
socket.on('userTyping', (data) => {
  // Show "User is typing..." indicator
});
```

### 4. Message Reactions
```javascript
<button onClick={() => addReaction(messageId, '😂')}>Add Reaction</button>
```

## Testing the Components

### Test Review System
1. Navigate to a service/venue detail page
2. Click on the review form
3. Fill in rating and comment
4. Submit and verify it appears in ReviewList

### Test Chat System
1. Navigate to /messages
2. Click on a conversation from the list
3. Type a message and click send
4. Verify message appears immediately
5. Check unread badge in navbar

### Test Recommendations
1. Navigate to /recommendations
2. Select filters and submit
3. Verify recommendations appear with scores and reasons
4. Click "Why Recommended" to see scoring breakdown

## Troubleshooting

### Messages not appearing
- Verify `conversationId` is valid
- Check browser console for API errors
- Ensure token is present in localStorage

### Reviews not submitting
- Check if user is authenticated (token in localStorage)
- Verify `serviceId` or `venueId` is provided
- Check backend server is running on port 5000

### Recommendations not loading
- Ensure filters are provided (for non-personalized)
- Verify AI recommendation routes are registered
- Check API response in browser network tab

## Support
For issues or questions about component integration, check the backend API logs and browser console for detailed error messages.
