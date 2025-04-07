const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
const authMiddleware = require('../middleware/auth');

// Create a new post
router.post('/', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const authorId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const newPost = new Post({ title, content, authorId });
    await newPost.save();
    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all posts with pagination
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const posts = await Post.find()
      .populate('authorId', 'username')
      .populate('comments.authorId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Post.countDocuments();
    res.status(200).json({ posts, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'username')
      .populate('comments.authorId', 'username');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a post by ID
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.authorId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a post by ID
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.authorId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    post.title = title;
    post.content = content;
    await post.save();

    const updatedPost = await Post.findById(req.params.id).populate('authorId', 'username');
    res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like or unlike a post
router.post('/:id/like', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userIndex = post.likes.indexOf(userId);
    if (userIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(userIndex, 1);
    }

    await post.save();
    const updatedPost = await Post.findById(req.params.id).populate('authorId', 'username');

    // Emit WebSocket event
    const io = req.app.get('socketio');
    io.to(req.params.id).emit('likeUpdated', updatedPost.likes);

    res.status(200).json({ message: userIndex === -1 ? 'Post liked' : 'Post unliked', post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a comment to a post
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { text } = req.body;
  const userId = req.user.id;

  if (!text) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = { text, authorId: userId };
    post.comments.push(newComment);
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('authorId', 'username')
      .populate('comments.authorId', 'username');

    // Emit WebSocket event
    const io = req.app.get('socketio');
    io.to(req.params.id).emit('commentAdded', newComment);

    res.status(200).json({ message: 'Comment added successfully', post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a comment from a post
router.delete('/:id/comment/:commentId', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { id: postId, commentId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    post.comments = post.comments.filter(c => c._id.toString() !== commentId);
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('authorId', 'username')
      .populate('comments.authorId', 'username');
    res.status(200).json({ message: 'Comment deleted successfully', post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Make io available to routes
router.use((req, res, next) => {
  req.app.set('socketio', req.app.get('socketio'));
  next();
});

module.exports = router;