/**
 * Connections Routes - Friend/Network Requests
 * Handles connection requests: send, accept, reject, list
 * /api/connections/*
 */

const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/authMiddleware');
const Connection = require('../models/Connection');
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
 * POST /api/connections/request
 * Send a connection request to another user
 */
router.post('/request', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { toUserId } = req.body;
    // Use _id instead of id for proper MongoDB ObjectId handling
    const fromUserId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!toUserId) {
      return res.status(400).json({ message: 'toUserId is required' });
    }

    // Validate both user IDs
    if (!mongoose.Types.ObjectId.isValid(fromUserId)) {
      return res.status(400).json({ message: 'Invalid sender user ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ message: 'Invalid recipient user ID' });
    }

    // Verify that both fromUser and toUser exist
    const fromUserExists = await User.findById(fromUserId);
    const toUserExists = await User.findById(toUserId);

    if (!fromUserExists || !toUserExists) {
      return res.status(404).json({ message: 'One or both users involved in the connection request were not found.' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Cannot send connection request to yourself' });
    }

    // Check if users already connected
    const existing = await Connection.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId, status: 'accepted' },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ message: 'Already connected with this user' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ message: 'Connection request already sent' });
      }
    }

    const connection = new Connection({
      fromUser: fromUserId,
      toUser: toUserId,
      status: 'pending',
    });

    await connection.save();
    await connection.populate('fromUser', 'name email department batch');
    await connection.populate('toUser', 'name email department batch');

    res.status(201).json({
      message: 'Connection request sent',
      request: connection,
    });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: 'Failed to send connection request' });
  }
});

/**
 * GET /api/connections/incoming
 * Get incoming connection requests
 */
router.get('/incoming', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    const requests = await Connection.find({
      toUser: userId,
      status: 'pending',
    })
      .populate('fromUser', 'name email profilePhoto department batch currentJobTitle currentCompany')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    res.status(500).json({ message: 'Failed to fetch incoming requests' });
  }
});

/**
 * GET /api/connections/outgoing
 * Get outgoing connection requests
 */
router.get('/outgoing', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    const requests = await Connection.find({
      fromUser: userId,
      status: 'pending',
    })
      .populate('toUser', 'name email profilePhoto department batch currentJobTitle currentCompany')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching outgoing requests:', error);
    res.status(500).json({ message: 'Failed to fetch outgoing requests' });
  }
});

/**
 * GET /api/connections
 * Get all accepted connections (friends list)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    console.log('📊 [Connections] Fetching connections for user:', userId);

    const connections = await Connection.find({
      $or: [
        { fromUser: userId, status: 'accepted' },
        { toUser: userId, status: 'accepted' },
      ],
    })
      .populate('fromUser', 'name email profilePhoto currentJobTitle currentCompany department batch currentLocation')
      .populate('toUser', 'name email profilePhoto currentJobTitle currentCompany department batch currentLocation')
      .sort({ updatedAt: -1 });

    console.log('📊 [Connections] Found', connections.length, 'total connections');

    // Transform to return connected user info with full details
    const connectedUsers = connections.map(conn => {
      // Safely determine the other user
      let otherUser = null;
      const fromUserId = conn.fromUser ? (conn.fromUser._id ? conn.fromUser._id.toString() : conn.fromUser.toString()) : null;
      
      if (fromUserId === userId) {
        otherUser = conn.toUser;
      } else {
        otherUser = conn.fromUser;
      }
      
      // Handle null user case
      if (!otherUser) {
        console.warn('⚠️ [Connections] Null user found in connection:', conn._id);
        return null;
      }
      
      return {
        _id: conn._id,
<<<<<<< Updated upstream
        user: otherUser,
=======
        user: {
          ...(otherUser.toObject ? otherUser.toObject() : otherUser),
          profilePhoto: otherUser.profilePicture || otherUser.profilePhoto || otherUser.photoURL,
          photoURL: otherUser.profilePicture || otherUser.profilePhoto || otherUser.photoURL,
        },
>>>>>>> Stashed changes
        connectedAt: conn.updatedAt,
        status: conn.status
      };
    }).filter(Boolean); // Remove null entries

    console.log('📊 [Connections] Returning', connectedUsers.length, 'valid connections after filtering');
    res.json(connectedUsers);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Failed to fetch connections' });
  }
});

/**
 * POST /api/connections/:requestId/accept
 * Accept a connection request
 */
router.post('/:requestId/accept', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { requestId } = req.params;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.toUser.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection already ' + connection.status });
    }

    connection.status = 'accepted';
    await connection.save();
    await connection.populate('fromUser', 'name email department batch');
    await connection.populate('toUser', 'name email department batch');

    res.json({
      message: 'Connection accepted',
      connection,
    });
  } catch (error) {
    console.error('Error accepting connection:', error);
    res.status(500).json({ message: 'Failed to accept connection' });
  }
});

/**
 * DELETE /api/connections/:requestId/reject
 * Reject a connection request
 */
router.delete('/:requestId/reject', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { requestId } = req.params;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.toUser.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot reject ' + connection.status + ' request' });
    }

    await Connection.deleteOne({ _id: requestId });

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    console.error('Error rejecting connection:', error);
    res.status(500).json({ message: 'Failed to reject connection' });
  }
});

/**
 * POST /api/connections/cancel/:requestId
 * Cancel an outgoing connection request
 */
router.post('/cancel/:requestId', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { requestId } = req.params;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    // Check if the user is the one who sent the request (fromUser)
    if (connection.fromUser.toString() !== userId) {
      return res.status(403).json({ message: 'You can only cancel your own requests' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending requests' });
    }

    await Connection.deleteOne({ _id: requestId });
    console.log(`✅ [ConnectionCancel] User ${userId} cancelled request to ${connection.toUser}`);

    res.json({ message: 'Connection request cancelled' });
  } catch (error) {
    console.error('Error cancelling connection request:', error);
    res.status(500).json({ message: 'Failed to cancel connection request' });
  }
});

/**
 * DELETE /api/connections/:connectionId
 * Disconnect from a user (remove friend)
 */
router.delete('/:connectionId', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { connectionId } = req.params;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({ message: 'Invalid connection ID' });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    if (connection.fromUser.toString() !== userId && connection.toUser.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Connection.deleteOne({ _id: connectionId });

    res.json({ message: 'Connection removed' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ message: 'Failed to remove connection' });
  }
});

/**
 * GET /api/connections/suggestions
 * Get suggested connections based on mutual connections and interests
 */
router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    // Get current user's connections
    const myConnections = await Connection.find({
      $or: [
        { fromUser: userId, status: 'accepted' },
        { toUser: userId, status: 'accepted' },
      ],
    });

    const connectedUserIds = myConnections.map(conn =>
      conn.fromUser.toString() === userId ? conn.toUser.toString() : conn.fromUser.toString()
    );

    // Find users not yet connected
    const suggestions = await User.find({
      _id: {
        $nin: [userId, ...connectedUserIds],
      },
      isActive: true,
    })
      .select('name email department batch')
      .limit(10);

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
});

module.exports = router;
