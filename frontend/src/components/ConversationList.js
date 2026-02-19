import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ConversationList.css';

function ConversationList({ onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchConversations();
    // Refresh conversations every 3 seconds
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/messages/user/conversations',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConversations(response.data.conversations || []);

      // Track unread counts
      const counts = {};
      response.data.conversations.forEach(conv => {
        if (conv.participant1._id === userId) {
          counts[conv._id] = conv.participant1Unread || 0;
        } else {
          counts[conv._id] = conv.participant2Unread || 0;
        }
      });
      setUnreadCounts(counts);
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/messages/${conversationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCounts({ ...unreadCounts, [conversationId]: 0 });
      onSelectConversation(conversationId);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participant1._id === userId
      ? conversation.participant2
      : conversation.participant1;
  };

  const getUnreadCount = (conversationId) => {
    return unreadCounts[conversationId] || 0;
  };

  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return msgDate.toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading conversations...</div>;
  }

  return (
    <div className="conversation-list-container">
      <h3>Messages</h3>

      {error && <div className="alert alert-error">{error}</div>}

      {conversations.length === 0 ? (
        <div className="no-conversations">
          <p>💬 No conversations yet</p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map(conversation => {
            const otherParticipant = getOtherParticipant(conversation);
            const unreadCount = getUnreadCount(conversation._id);
            const lastMessage = conversation.lastMessage || 'No messages yet';

            return (
              <div
                key={conversation._id}
                className={`conversation-item ${unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(conversation._id)}
              >
                <div className="conversation-header">
                  <h4 className="participant-name">
                    {otherParticipant.name || otherParticipant.email}
                    {otherParticipant.role && (
                      <span className="role-badge">{otherParticipant.role}</span>
                    )}
                  </h4>
                  <span className="message-time">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                </div>

                <p className="last-message">{lastMessage}</p>

                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ConversationList;
