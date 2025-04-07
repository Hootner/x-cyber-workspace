const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const postRoutes = require('./posts');
const Post = require('../models/Posts');
const User = require('../models/Users');

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

const app = express();
app.use(express.json());
app.use('/api/posts', postRoutes);

// Mock io for WebSocket
const io = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};
app.set('socketio', io);

let mongoServer;
let token;
let userId;

describe('Posts Routes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a test user
    const user = new User({ username: 'testuser', password: 'password123' });
    await user.save();
    userId = user._id;
    token = jwt.sign({ id: userId, username: 'testuser' }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Post.deleteMany({});
  });

  describe('POST /api/posts', () => {
    it('should create a new post without an image', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Post', content: 'This is a test post' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Post created successfully');
      expect(res.body.post).toHaveProperty('title', 'Test Post');
      expect(res.body.post).toHaveProperty('content', 'This is a test post');
      expect(res.body.post).toHaveProperty('authorId', userId.toString());
      expect(res.body.post.imageUrl).toBeNull();
    });

    it('should create a new post with an image', async () => {
      // Mock Cloudinary upload
      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(null, { secure_url: 'https://res.cloudinary.com/test/image.jpg' });
        return { end: jest.fn() };
      });

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Test Post with Image')
        .field('content', 'This is a test post with an image')
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg');

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Post created successfully');
      expect(res.body.post).toHaveProperty('title', 'Test Post with Image');
      expect(res.body.post).toHaveProperty('content', 'This is a test post with an image');
      expect(res.body.post).toHaveProperty('imageUrl', 'https://res.cloudinary.com/test/image.jpg');
    });

    it('should return 400 if title or content is missing', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '', content: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Title and content are required');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Test Post', content: 'This is a test post' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('No token, authorization denied');
    });
  });

  describe('PUT /api/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      const post = new Post({
        title: 'Original Post',
        content: 'Original content',
        authorId: userId,
        imageUrl: 'https://res.cloudinary.com/test/original-image.jpg',
      });
      await post.save();
      postId = post._id;
    });

    it('should update a post without changing the image', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Post', content: 'Updated content' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Post updated successfully');
      expect(res.body.post).toHaveProperty('title', 'Updated Post');
      expect(res.body.post).toHaveProperty('content', 'Updated content');
      expect(res.body.post).toHaveProperty('imageUrl', 'https://res.cloudinary.com/test/original-image.jpg');
    });

    it('should update a post with a new image', async () => {
      // Mock Cloudinary destroy and upload
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });
      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(null, { secure_url: 'https://res.cloudinary.com/test/new-image.jpg' });
        return { end: jest.fn() };
      });

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Updated Post with Image')
        .field('content', 'Updated content with image')
        .attach('image', Buffer.from('fake-image-data'), 'new-image.jpg');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Post updated successfully');
      expect(res.body.post).toHaveProperty('title', 'Updated Post with Image');
      expect(res.body.post).toHaveProperty('content', 'Updated content with image');
      expect(res.body.post).toHaveProperty('imageUrl', 'https://res.cloudinary.com/test/new-image.jpg');
      expect(cloudinary.uploader.destroy).toHaveBeenCalled();
    });

    it('should return 403 if user is not the author', async () => {
      const otherUser = new User({ username: 'otheruser', password: 'password123' });
      await otherUser.save();
      const otherToken = jwt.sign({ id: otherUser._id, username: 'otheruser' }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Unauthorized Update', content: 'This should fail' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You can only edit your own posts');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      const post = new Post({
        title: 'Post to Delete',
        content: 'Content to delete',
        authorId: userId,
        imageUrl: 'https://res.cloudinary.com/test/image-to-delete.jpg',
      });
      await post.save();
      postId = post._id;
    });

    it('should delete a post and its image', async () => {
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Post deleted successfully');
      expect(cloudinary.uploader.destroy).toHaveBeenCalled();
    });

    it('should return 403 if user is not the author', async () => {
      const otherUser = new User({ username: 'otheruser', password: 'password123' });
      await otherUser.save();
      const otherToken = jwt.sign({ id: otherUser._id, username: 'otheruser' }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You can only delete your own posts');
    });
  });
});