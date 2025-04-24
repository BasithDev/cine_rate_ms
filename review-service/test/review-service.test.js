const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');

let app;
let Review;
const fakeUserId = 'fakeUserId';
const fakeMovieId = 'fakeMovieId';
const fakeReviewId = 'fakeReviewId';
const fakeReviews = [{ _id: fakeReviewId, userId: fakeUserId, movieId: fakeMovieId, review: 'Great movie!' }];

beforeAll(async () => {
  jest.resetModules(); // Clear the require cache
  process.env.MONGODB_URI = 'mongodb://localhost:27017/cinerate-review-test';
  app = require('../index'); // Registers schema
  Review = mongoose.model('Review');

  // --- MOCK MONGOOSE REVIEW MODEL ---
  jest.spyOn(Review, 'find').mockImplementation((query) => {
    if (query.userId === fakeUserId) {
      return { exec: () => Promise.resolve(fakeReviews) };
    }
    if (query.movieId === fakeMovieId) {
      return { exec: () => Promise.resolve(fakeReviews) };
    }
    return { exec: () => Promise.resolve([]) };
  });
  jest.spyOn(Review, 'findOne').mockImplementation((query) => {
    if (query._id === fakeReviewId) {
      return { exec: () => Promise.resolve(fakeReviews[0]) };
    }
    return { exec: () => Promise.resolve(null) };
  });
  jest.spyOn(Review, 'findOneAndDelete').mockImplementation((query) => {
    if (query._id === fakeReviewId) {
      return { exec: () => Promise.resolve(fakeReviews[0]) };
    }
    return { exec: () => Promise.resolve(null) };
  });
  jest.spyOn(Review.prototype, 'save').mockResolvedValue(true);
});

afterAll(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await mongoose.connection.close();
});

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
