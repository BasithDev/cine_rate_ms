// Tests for watchlist-service endpoints and model
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = new MongoMemoryServer();
  const uri = await mongoServer.getUri();
  await mongoose.connect(uri);
  app = require('../index');
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Watchlist Service', () => {
  test('should pass basic sanity check', () => {
    expect(true).toBe(true);
  });

  test('GET /test should return service running', async () => {
    const res = await request(app).get('/test');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Watchlist service is running');
  });

  test('POST /add should add to watchlist', async () => {
    const payload = { userId: 'testuser', contentId: 'testcontent', mediaType: 'movie' };
    const res = await request(app).post('/add').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/added to watchlist|already in the watchlist/);
  });

  test('GET /:userId should return watchlist', async () => {
    const res = await request(app).get('/testuser');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /remove should remove from watchlist', async () => {
    const payload = { userId: 'testuser', contentId: 'testcontent' };
    const res = await request(app).post('/remove').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Content removed from watchlist');
  });
});
