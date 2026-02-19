import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConversationList from './ConversationList';
import ChatInterface from './ChatInterface';
import './ChatPage.css';

function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationDetails, setConversationDetails] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchUnreadCount();
    // Check unread count every 5 seconds
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const handleSelectConversation = async (conversationId) => {
    setSelectedConversation(conversationId);
    // Fetch conversation details from the message list endpoint
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/messages/conversation/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Extract recipient info from conversation
      const messages = response.data.messages || [];
      if (messages.length > 0) {
        const otherMessage = messages.find(m => m.senderId !== userId) || messages[0];
        setConversationDetails({
          name: otherMessage.senderName,
          role: otherMessage.senderRole,
          id: otherMessage.senderId
        });
      }
    } catch (err) {
      console.error('Error fetching conversation details:', err);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>💬 Messages</h2>
            {unreadCount > 0 && (
              <span className="unread-indicator">{unreadCount}</span>
            )}
          </div>
          <ConversationList onSelectConversation={handleSelectConversation} />
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedConversation ? (
            <ChatInterface
              conversationId={selectedConversation}
              recipientName={conversationDetails?.name}
              recipientRole={conversationDetails?.role}
              recipientId={conversationDetails?.id}
            />
          ) : (
            <div className="empty-chat">
              <div className="empty-chat-content">
                <div className="large-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
