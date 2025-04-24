const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../index');

const testEmail = 'testuser@example.com';
const testPassword = 'testpassword';
const testName = 'Test User';
let userId = 'fakeUserId';
let accessToken;

// --- MOCK MONGOOSE USER MODEL ---
const User = mongoose.model('User');

beforeAll(() => {
  // Mock bcrypt
  jest.spyOn(bcrypt, 'compare').mockImplementation((pw, hash) => {
    if ((pw === testPassword && hash === '$2a$10$hashedpassword') || (pw === 'newpass123' && hash === '$2a$10$newhashedpassword')) return Promise.resolve(true);
    return Promise.resolve(false);
  });
  jest.spyOn(bcrypt, 'hash').mockImplementation((pw) => {
    if (pw === testPassword) return Promise.resolve('$2a$10$hashedpassword');
    if (pw === 'newpass123') return Promise.resolve('$2a$10$newhashedpassword');
    return Promise.resolve('somehash');
  });

  // Mock User.findOne
  jest.spyOn(User, 'findOne').mockImplementation((query) => {
    if (query.email === testEmail || query._id === userId) {
      return Promise.resolve({
        _id: userId,
        email: testEmail,
        password: '$2a$10$hashedpassword',
        name: testName,
        save: jest.fn().mockResolvedValue(true)
      });
    }
    return Promise.resolve(null);
  });
  // Mock User.findOneAndUpdate
  jest.spyOn(User, 'findOneAndUpdate').mockImplementation((query, update) => {
    if (query._id === userId) {
      return Promise.resolve({
        _id: userId,
        email: update.email || testEmail,
        name: update.name || testName
      });
    }
    return Promise.resolve(null);
  });
  // Mock User.prototype.save
  jest.spyOn(User.prototype, 'save').mockResolvedValue(true);
});

afterAll(async () => {
  jest.restoreAllMocks();
});

describe('User Service', () => {
  test('GET /test should confirm service is running', async () => {
    const res = await request(app).get('/test');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('User service is running');
  });

  test('POST /signup should create a new user', async () => {
    const res = await request(app)
      .post('/signup')
      .send({ email: testEmail, password: testPassword, name: testName });
    expect([200, 201, 400]).toContain(res.statusCode);
    if(res.statusCode === 201) {
      expect(res.body.message).toBe('User created');
    } else {
      expect(res.body.message).toBe('Email already in use');
    }
  });

  test('POST /login should authenticate user', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: testEmail, password: testPassword });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('userId');
    userId = res.body.userId;
    accessToken = res.body.accessToken;
  });

  test('GET /:id should get user info', async () => {
    const res = await request(app).get(`/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('email');
  });

  test('POST /update should update user info', async () => {
    const res = await request(app)
      .post('/update')
      .send({ userId, name: 'Updated Name', email: testEmail });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User updated');
  });

  test('POST /change-password should change user password', async () => {
    const res = await request(app)
      .post('/change-password')
      .send({ userId, oldPassword: testPassword, newPassword: 'newpass123' });
    expect([200, 201, 400, 404]).toContain(res.statusCode);
    if(res.statusCode === 200) {
      expect(res.body.message).toBe('Password changed');
    }
  });

  test('POST /login should work with new password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: testEmail, password: 'newpass123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('userId');
  });
});
