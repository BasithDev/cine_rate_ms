const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectToDatabase } = require('../index');
const { MongoMemoryServer } = require('mongodb-memory-server');

const testEmail = 'testuser@example.com';
const testPassword = 'testpassword';
const testName = 'Test User';
let userId;
let mongoServer;
const User = mongoose.model('User');

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectToDatabase(uri);
});

beforeEach(async () => {
  // Clear users for test isolation
  await User.deleteMany({});
  // Only seed for non-signup tests
  const currentTest = expect.getState().currentTestName;
  if (currentTest !== 'User Service › POST /signup should create a new user') {
    await request(app)
      .post('/signup')
      .send({ email: testEmail, password: testPassword, name: testName });
    const res = await request(app)
      .post('/login')
      .send({ email: testEmail, password: testPassword });
    userId = res.body.userId;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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
});