const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

// 💬 Send Message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { recipientId, messageText, conversationId, serviceId, venueId, bookingId } = req.body;

    // Validation
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (!messageText || messageText.trim().length === 0) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    // Get sender and recipient info
    const sender = await User.findById(req.userId);
    const recipient = await User.findById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      $or: [
        { participant1: req.userId, participant2: recipientId },
        { participant1: recipientId, participant2: req.userId }
      ]
    });

    if (!conversation) {
      conversation = new Conversation({
        participant1: req.userId,
        participant2: recipientId,
        serviceId,
        venueId,
        bookingId,
        conversationType: serviceId ? 'service_inquiry' : venueId ? 'venue_inquiry' : 'general',
        subject: `Chat with ${recipient.name}`
      });
      await conversation.save();
    }

    // Create message
    const message = new Message({
      senderId: req.userId,
      senderName: sender.name,
      senderRole: sender.role,
      recipientId,
      recipientName: recipient.name,
      recipientRole: recipient.role,
      conversationId: conversation._id,
      serviceId,
      venueId,
      bookingId,
      messageText
    });

    await message.save();

    // Update conversation metadata
    conversation.lastMessage = messageText.substring(0, 100);
    conversation.lastMessageTime = new Date();
    conversation.messageCount = (conversation.messageCount || 0) + 1;

    // Increment unread for recipient
    if (conversation.participant1.toString() === recipientId) {
      conversation.participant1Unread = (conversation.participant1Unread || 0) + 1;
    } else {
      conversation.participant2Unread = (conversation.participant2Unread || 0) + 1;
    }

    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error sending message: ' + err.message });
  }
});

// 💬 Get Conversation Messages
router.get('/conversation/:conversationId', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check authorization
    if (conversation.participant1.toString() !== req.userId && conversation.participant2.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized access to this conversation' });
    }

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark messages as read for current user
    await Message.updateMany(
      { conversationId: req.params.conversationId, recipientId: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Reset unread count
    if (conversation.participant1.toString() === req.userId) {
      conversation.participant1Unread = 0;
    } else {
      conversation.participant2Unread = 0;
    }
    await conversation.save();

    res.json({
      success: true,
      messages,
      conversation
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages: ' + err.message });
  }
});

// 📋 Get User Conversations
router.get('/user/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      $or: [
        { participant1: req.userId },
        { participant2: req.userId }
      ]
    })
      .sort({ lastMessageTime: -1 })
      .populate('participant1', 'name profileImage role')
      .populate('participant2', 'name profileImage role');

    res.json({
      success: true,
      conversations
    });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Error fetching conversations: ' + err.message });
  }
});

// 🔍 Get Direct Conversation
router.get('/direct/:userId', authMiddleware, async (req, res) => {
  try {
    let conversation = await Conversation.findOne({
      $or: [
        { participant1: req.userId, participant2: req.params.userId },
        { participant1: req.params.userId, participant2: req.userId }
      ]
    })
      .populate('participant1', 'name profileImage role email')
      .populate('participant2', 'name profileImage role email');

    if (!conversation) {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      conversation = new Conversation({
        participant1: req.userId,
        participant2: req.params.userId,
        subject: `Chat with ${user.name}`
      });
      await conversation.save();
      await conversation.populate('participant1 participant2', 'name profileImage role email');
    }

    res.json({
      success: true,
      conversation
    });
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ message: 'Error fetching conversation: ' + err.message });
  }
});

// ✅ Mark Conversation As Read
router.put('/:conversationId/read', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Reset unread count
    if (conversation.participant1.toString() === req.userId) {
      conversation.participant1Unread = 0;
    } else {
      conversation.participant2Unread = 0;
    }
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (err) {
    console.error('Error marking conversation as read:', err);
    res.status(500).json({ message: 'Error marking conversation as read: ' + err.message });
  }
});

// 🗑️ Delete Message
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    message.deletedAt = new Date();
    message.messageText = '[This message was deleted]';
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ message: 'Error deleting message: ' + err.message });
  }
});

// 🔔 Get Unread Count
router.get('/user/unread-count', authMiddleware, async (req, res) => {
  try {
    const unreadMessages = await Message.countDocuments({
      recipientId: req.userId,
      isRead: false
    });

    const conversations = await Conversation.find({
      $or: [
        { participant1: req.userId },
        { participant2: req.userId }
      ]
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      if (conv.participant1.toString() === req.userId) {
        totalUnread += conv.participant1Unread || 0;
      } else {
        totalUnread += conv.participant2Unread || 0;
      }
    });

    res.json({
      success: true,
      unreadMessages,
      totalUnread
    });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Error fetching unread count: ' + err.message });
  }
});

module.exports = router;
