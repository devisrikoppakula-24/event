import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function VenueDetail() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('marriage');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/venues/${id}`);
        setVenue(response.data);
      } catch (err) {
        console.error('Error fetching venue:', err);
      }
    };
    fetchVenue();
  }, [id]);

  const handleBooking = async () => {
    if (!eventDate) {
      alert('Please select an event date');
      return;
    }
    try {
      const booking = {
        venue: id,
        eventDate,
        eventType,
        totalCost: venue.pricePerDay
      };
      const response = await axios.post('http://localhost:5000/api/bookings/', booking, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      navigate('/services', { state: { bookingId: response.data._id } });
    } catch (err) {
      console.error('Error booking venue:', err);
    }
  };

  if (!venue) return <div>Loading...</div>;

  return (
    <div className="container">
      <h1>{venue.name}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '20px' }}>
        <div>
          <img src={venue.images[0]} alt={venue.name} style={{ width: '100%', borderRadius: '8px' }} />
          <h2>Description</h2>
          <p>{venue.description}</p>
          <h2>Facilities</h2>
          <ul>
            {venue.facilities && venue.facilities.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          <h2>Catering Options</h2>
          <ul>
            {venue.cateringOptions && venue.cateringOptions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
          <h3>Book This Venue</h3>
          <p><strong>Capacity:</strong> {venue.capacity} people</p>
          <p><strong>Price:</strong> ₹{venue.pricePerDay}/day</p>
          <p><strong>Location:</strong> {venue.location}</p>
          <p><strong>Contact:</strong> {venue.contactNumber}</p>
          <div style={{ marginTop: '20px' }}>
            <label>Select Event Date:</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            <label style={{ marginTop: '15px', display: 'block' }}>Event Type:</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="marriage">Marriage</option>
              <option value="birthday">Birthday</option>
              <option value="engagement">Engagement</option>
              <option value="corporate">Corporate</option>
            </select>
            <button onClick={handleBooking} className="btn-primary" style={{ width: '100%', marginTop: '20px' }}>
              Proceed to Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VenueDetail;
