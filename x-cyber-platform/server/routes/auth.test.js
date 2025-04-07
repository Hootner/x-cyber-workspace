const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authRoutes = require('./auth');
const User = require('../models/Users');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let mongoServer;

describe('Auth Routes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.user).toHaveProperty('username', 'testuser');
      expect(res.body).toHaveProperty('token');
    });

    it('should not register a user with an existing username', async () => {
      await new User({ username: 'testuser', password: 'password123' }).save();

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('User already exists');
    });

    it('should return 400 if username or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: '', password: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Username and password are required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      const user = new User({ username: 'testuser', password: 'password123' });
      await user.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.user).toHaveProperty('username', 'testuser');
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if username or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: '', password: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Username and password are required');
    });
  });
});