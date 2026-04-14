/**
 * Chats/Messaging Routes
 * Handles messaging between users: chat creation, messages, real-time updates
 * /api/chats/*
 */

const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/authMiddleware');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

const ensureDb = (res) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ [DATABASE] Request received but database is not connected.');
    return true; 
  }
  return true;
};

/**
 * POST /api/chats/create
 * Create or get existing chat between two users
 */
router.post('/create', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { user2Id } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!user2Id) {
      return res.status(400).json({ message: 'user2Id is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(user2Id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (userId === user2Id) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    // Optional: Only allow chats with accepted connections
    const Connection = require('../models/Connection');
    const isConnected = await Connection.findOne({
      $or: [
        { fromUser: userId, toUser: user2Id, status: 'accepted' },
        { fromUser: user2Id, toUser: userId, status: 'accepted' },
      ],
    });
    if (!isConnected) {
      return res.status(403).json({ message: 'You can only chat with your connections' });
    }

    // Check if chat already exists
    const existingChat = await ChatRoom.findOne({
      $or: [
        { user1: userId, user2: user2Id },
        { user1: user2Id, user2: userId },
      ],
    })
      .populate('user1', 'name email department batch profilePhoto currentJobTitle currentCompany')
      .populate('user2', 'name email department batch profilePhoto currentJobTitle currentCompany');

    if (existingChat) {
      // Format with consistent photo fields, handle null users
      const chatObj = existingChat.toObject ? existingChat.toObject() : existingChat;
      
      // Skip if either user is null
      if (!chatObj.user1 || !chatObj.user2) {
        return res.status(404).json({ message: 'One of the users in this chat no longer exists' });
      }
      
      return res.json({
        message: 'Chat already exists',
        chatId: existingChat._id,
        chat: existingChat,
      });
    }

    // Create new chat
    const newChat = new ChatRoom({
      user1: userId,
      user2: user2Id,
      lastMessage: null,
    });

    await newChat.save();
    await newChat.populate('user1', 'name email department batch profilePhoto currentJobTitle currentCompany');
    await newChat.populate('user2', 'name email department batch profilePhoto currentJobTitle currentCompany');

    // Emit event for real-time chat creation
    const io = req.app.get('io');
    io.to(`user_${user2Id}`).emit('chat-created', {
      chatId: newChat._id,
      user: await User.findById(userId).select('name email'),
    });

    res.status(201).json({
      message: 'Chat created',
      chatId: newChat._id,
      chat: {
        ...newChat.toObject ? newChat.toObject() : newChat,
        user1: newChat.user1 ? {
          ...newChat.user1,
          profilePhoto: newChat.user1.profilePicture || newChat.user1.profilePhoto || newChat.user1.photoURL,
          photoURL: newChat.user1.profilePicture || newChat.user1.profilePhoto || newChat.user1.photoURL,
        } : null,
        user2: newChat.user2 ? {
          ...newChat.user2,
          profilePhoto: newChat.user2.profilePicture || newChat.user2.profilePhoto || newChat.user2.photoURL,
          photoURL: newChat.user2.profilePicture || newChat.user2.profilePhoto || newChat.user2.photoURL,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Failed to create chat' });
  }
});

/**
 * GET /api/chats
 * Get all chats for current user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    console.log('📊 [Chats] Fetching chats for user:', userId);

    const chats = await ChatRoom.find({
      $or: [
        { user1: userId },
        { user2: userId },
      ],
    })
      .populate('user1', 'name email department batch profilePhoto currentJobTitle currentCompany')
      .populate('user2', 'name email department batch profilePhoto currentJobTitle currentCompany')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'name email profilePhoto' },
      })
      .sort({ updatedAt: -1 });

    console.log('📊 [Chats] Found', chats.length, 'total chats');

    // Ensure all user objects have consistent photo field and handle null users
    const formattedChats = chats.map(chat => {
      const chatObj = chat.toObject ? chat.toObject() : chat;
      
      // Handle null users (deleted users)
      if (!chatObj.user1 || !chatObj.user2) {
        console.warn('⚠️ [Chats] Null user in chat', chatObj._id);
        return null;
      }
      
      return {
        ...chatObj,
        user1: {
          ...chatObj.user1,
          profilePhoto: chatObj.user1.profilePicture || chatObj.user1.profilePhoto || chatObj.user1.photoURL,
          photoURL: chatObj.user1.profilePicture || chatObj.user1.profilePhoto || chatObj.user1.photoURL,
        },
        user2: {
          ...chatObj.user2,
          profilePhoto: chatObj.user2.profilePicture || chatObj.user2.profilePhoto || chatObj.user2.photoURL,
          photoURL: chatObj.user2.profilePicture || chatObj.user2.profilePhoto || chatObj.user2.photoURL,
        },
      };
    }).filter(Boolean); // Remove null entries

    console.log('📊 [Chats] Returning', formattedChats.length, 'valid chats after filtering');
    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
});

/**
 * GET /api/chats/:chatId/messages
 * Get all messages in a chat
 */
router.get('/:chatId/messages', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { chatId } = req.params;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      // Return empty array for invalid chat IDs (better UX)
      return res.json([]);
    }

    // Verify user is part of this chat
    const chat = await ChatRoom.findById(chatId);
    if (!chat) {
      // Return empty array if chat doesn't exist (better UX than 404)
      return res.json([]);
    }

    if (chat.user1.toString() !== userId && chat.user2.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const messages = await Message.find({ chatId })
      .populate('senderId', 'name email profilePhoto')
      .sort({ createdAt: 1 });

    // Format messages with consistent photo fields for sender, handle null senders
    const formattedMessages = messages.map(msg => {
      const msgObj = msg.toObject ? msg.toObject() : msg;
      
      // Handle null sender (deleted user)
      if (!msgObj.senderId) {
        console.warn('⚠️ [Messages] Null sender in message', msgObj._id);
        return null;
      }
      
      return {
        ...msgObj,
        senderId: {
          ...msgObj.senderId,
          profilePhoto: msgObj.senderId.profilePicture || msgObj.senderId.profilePhoto || msgObj.senderId.photoURL,
          photoURL: msgObj.senderId.profilePicture || msgObj.senderId.profilePhoto || msgObj.senderId.photoURL,
        },
      };
    }).filter(Boolean); // Remove null entries

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.json([]); // Return empty array on error
  }
});

/**
 * POST /api/chats/:chatId/messages
 * Send a message in a chat
 */
router.post('/:chatId/messages', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    // Verify user is part of this chat
    const chat = await ChatRoom.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (chat.user1.toString() !== userId && chat.user2.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create message
    const message = new Message({
      chatId,
      senderId: userId,
      text: text.trim(),
    });

    await message.save();
    await message.populate('senderId', 'name email');

    // Update chat's last message and update timestamp
    chat.lastMessage = message._id;
    await chat.save();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`chat_${chatId}`).emit('new-message', {
      message,
    });

    // Notify the other user
    const otherUserId = chat.user1.toString() === userId ? chat.user2 : chat.user1;
    io.to(`user_${otherUserId}`).emit('message-received', {
      chatId,
      message,
    });

    res.status(201).json({
      message: 'Message sent',
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

/**
 * DELETE /api/chats/:chatId/messages/:messageId
 * Delete a message (only by sender)
 */
router.delete('/:chatId/messages/:messageId', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { chatId, messageId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid IDs' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Message.deleteOne({ _id: messageId });

    // Emit deletion event
    const io = req.app.get('io');
    io.to(`chat_${chatId}`).emit('message-deleted', { messageId });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

/**
 * GET /api/chats/:userId/:partnerId/last-message
 * Get the last message in a conversation between two users
 */
router.get('/:userId/:partnerId/last-message', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { userId, partnerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }

    const chat = await ChatRoom.findOne({
      $or: [
        { user1: userId, user2: partnerId },
        { user1: partnerId, user2: userId },
      ],
    }).populate({
      path: 'lastMessage',
      populate: { path: 'senderId', select: 'name' },
    });

    if (!chat || !chat.lastMessage) {
      return res.json(null);
    }

    res.json(chat.lastMessage);
  } catch (error) {
    console.error('Error fetching last message:', error);
    res.status(500).json({ message: 'Failed to fetch last message' });
  }
});

/**
 * GET /api/messages/incoming
 * Get incoming messages for current user
 */
router.get('/messages/incoming', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user.id;

    // Get all chats for this user
    const chats = await ChatRoom.find({
      $or: [
        { user1: userId },
        { user2: userId },
      ],
    }).select('_id');

    const chatIds = chats.map(chat => chat._id);

    // Get unread messages from these chats
    const messages = await Message.find({
      chatId: { $in: chatIds },
      read: false,
      senderId: { $ne: userId },
    })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching incoming messages:', error);
    res.status(500).json({ message: 'Failed to fetch incoming messages' });
  }
});

module.exports = router;
