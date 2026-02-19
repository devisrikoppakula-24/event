import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatInterface.css';

function ChatInterface({ conversationId, recipientName, recipientRole, recipientId }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      // Refresh messages every 2 seconds for real-time feel
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/messages/conversation/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/messages/send',
        {
          conversationId,
          messageText: messageText.trim(),
          recipientId: recipientId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessageText('');
      setMessages([...messages, response.data.message]);
      scrollToBottom();
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Delete this message?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://localhost:5000/api/messages/${messageId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(messages.filter(m => m._id !== messageId));
      } catch (err) {
        console.error('Error deleting message:', err);
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>{recipientName || 'Chat'}</h3>
        <span className="recipient-role">{recipientRole || 'User'}</span>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>👋 No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => {
              const isOwn = msg.senderId === userId;
              const showDate = index === 0 || 
                formatDate(messages[index - 1].createdAt) !== formatDate(msg.createdAt);

              return (
                <div key={msg._id}>
                  {showDate && (
                    <div className="message-date-separator">
                      {formatDate(msg.createdAt)}
                    </div>
                  )}

                  <div className={`message ${isOwn ? 'sent' : 'received'}`}>
                    <div className="message-content">
                      {msg.messageText === '[deleted]' ? (
                        <span className="deleted-message">Message deleted</span>
                      ) : (
                        <p>{msg.messageText}</p>
                      )}
                      <span className="message-time">
                        {formatTime(msg.createdAt)}
                        {isOwn && msg.isRead && ' ✓✓'}
                      </span>
                    </div>

                    {isOwn && msg.messageText !== '[deleted]' && (
                      <button
                        className="delete-message-btn"
                        onClick={() => handleDeleteMessage(msg._id)}
                        title="Delete message"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
          disabled={loading}
        />
        <button type="submit" className="send-btn" disabled={loading || !messageText.trim()}>
          {loading ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
