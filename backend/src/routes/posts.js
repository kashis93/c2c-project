/**
 * Posts Routes - Social Feed
 * Handles all post operations: create, read, update, delete, like, comment
 * POST /api/posts
 */

const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/authMiddleware-new');
const Post = require('../models/Post');
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
 * GET /api/posts
 * Get all posts (feed)
 */
router.get('/', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('authorId', 'name email department batch profilePhoto currentJobTitle')
      .lean();

    // Add like count and comment count to each post
    const enrichedPosts = posts.map(post => ({
      ...post,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
      liked: false,
    }));

    res.json(enrichedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { text, image, title, tags } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Post text is required' });
    }

    const post = new Post({
      authorId: req.user._id ? req.user._id.toString() : req.user.id,
      text: text.trim(),
      image: image || undefined,
      title: title || undefined,
      tags: Array.isArray(tags) ? tags.filter(t => typeof t === 'string') : [],
      likes: [],
      comments: [],
    });

    await post.save();
    await post.populate('authorId', 'name email department batch profilePhoto currentJobTitle');

    res.status(201).json({
      ...post.toObject(),
      likesCount: 0,
      commentsCount: 0,
      liked: false,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

/**
 * GET /api/posts/user/:userId
 * Get all posts by a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const posts = await Post.find({ authorId: userId })
      .sort({ createdAt: -1 })
      .populate('authorId', 'name email department batch')
      .lean();

    const enrichedPosts = posts.map(post => ({
      ...post,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
      liked: false,
    }));

    res.json(enrichedPosts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Failed to fetch user posts' });
  }
});

/**
 * GET /api/posts/:postId
 * Get a single post
 */
router.get('/:postId', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId)
      .populate('authorId', 'name email department batch')
      .populate('comments.authorId', 'name email')
      .lean();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      ...post,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
      liked: false,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

/**
 * PUT /api/posts/:postId
 * Update a post (only by author)
 */
router.put('/:postId', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { postId } = req.params;
    const { text, image, title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (text) post.text = text.trim();
    if (image) post.image = image;
    if (title) post.title = title;

    await post.save();
    await post.populate('authorId', 'name email department batch');

    res.json({
      ...post.toObject(),
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
      liked: false,
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

/**
 * DELETE /api/posts/:postId
 * Delete a post (only by author)
 */
router.delete('/:postId', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Post.deleteOne({ _id: postId });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

/**
 * POST /api/posts/:postId/like
 * Like a post
 */
router.post('/:postId/like', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { postId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user has already liked
    const hasLiked = post.likes && post.likes.some(id => id.toString() === userId);

    if (!hasLiked) {
      post.likes = post.likes || [];
      post.likes.push(userId);
      await post.save();
    }

    res.json({
      message: 'Post liked',
      likesCount: post.likes.length,
      liked: true,
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Failed to like post' });
  }
});

/**
 * DELETE /api/posts/:postId/like
 * Unlike a post
 */
router.delete('/:postId/like', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { postId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Remove like
    if (post.likes) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
      await post.save();
    }

    res.json({
      message: 'Post unliked',
      likesCount: post.likes ? post.likes.length : 0,
      liked: false,
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ message: 'Failed to unlike post' });
  }
});

/**
 * GET /api/posts/:postId/likes
 * Get like status and count for a post
 */
router.get('/:postId/likes', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { postId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId).lean();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const liked = post.likes ? post.likes.some(id => id.toString() === userId) : false;
    const count = post.likes ? post.likes.length : 0;

    res.json({ liked, count });
  } catch (error) {
    console.error('Error getting likes:', error);
    res.status(500).json({ message: 'Failed to get likes' });
  }
});

/**
 * POST /api/posts/:postId/comments
 * Add a comment to a post
 */
router.post('/:postId/comments', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { postId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      id: new mongoose.Types.ObjectId().toString(),
      authorId: req.user._id ? req.user._id.toString() : req.user.id,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments = post.comments || [];
    post.comments.push(comment);
    await post.save();

    // Populate the comment author
    await post.populate('comments.authorId', 'name email');

    res.status(201).json({
      message: 'Comment added',
      comment: post.comments[post.comments.length - 1],
      commentsCount: post.comments.length,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

/**
 * GET /api/posts/:postId/comments
 * Get all comments for a post
 */
router.get('/:postId/comments', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId)
      .populate('comments.authorId', 'name email department batch')
      .lean();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      comments: post.comments || [],
      count: post.comments ? post.comments.length : 0,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

/**
 * DELETE /api/posts/:postId/comments/:commentId
 * Delete a comment (only by comment author or post author)
 */
router.delete('/:postId/comments/:commentId', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { postId, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments && post.comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment author or post author
    if (comment.authorId.toString() !== (req.user._id ? req.user._id.toString() : req.user.id) && post.authorId.toString() !== (req.user._id ? req.user._id.toString() : req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    post.comments = post.comments.filter(c => c.id !== commentId);
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

module.exports = router;
