const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');

const testReview = {
  userId: 'testuser',
  contentId: 'testcontent',
  username: 'TestUser',
  review: 'Great movie!',
  spoilerContains: false,
  mediaType: 'movie',
};

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('Review Service', () => {
  test('GET /test should confirm service is running', async () => {
    const res = await request(app).get('/test');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Review service is running');
  });

  test('POST /add should add a review', async () => {
    const res = await request(app)
      .post('/add')
      .send(testReview);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Review added');
  });

  test('GET /:mediaType/:contentId should return reviews', async () => {
    const res = await request(app).get(`/${testReview.mediaType}/${testReview.contentId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('review', testReview.review);
  });

  test('POST /delete should delete a review', async () => {
    const res = await request(app)
      .post('/delete')
      .send({ contentId: testReview.contentId, userId: testReview.userId });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Review deleted');
  });
});
