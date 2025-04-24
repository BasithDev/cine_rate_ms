jest.mock('express-jwt', () => ({
  expressjwt: () => {
    const mw = (req, res, next) => next();
    mw.unless = () => mw;
    return mw;
  }
}));
jest.mock('axios');
const axios = require('axios');
const request = require('supertest');
const app = require('../index');

describe('API Gateway', () => {
  test('GET /health should confirm gateway is healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('API Gateway is healthy');
  });

  test('GET /unknown should return 404 for unknown service', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toBe(404);
    expect(res.text).toBe('Service not found');
  });

  describe('Proxy integration tests', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Proxies /user/test to downstream user service', async () => {
      axios.mockResolvedValueOnce({ status: 200, data: { message: 'User Service Test' } });
      const res = await request(app).get('/user/test');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: 'User Service Test' });
      expect(axios).toHaveBeenCalled();
    });

    test('Proxies /review/test to downstream review service', async () => {
      axios.mockResolvedValueOnce({ status: 200, data: { message: 'Review Service Test' } });
      const res = await request(app).get('/review/test');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: 'Review Service Test' });
      expect(axios).toHaveBeenCalled();
    });

    test('Proxies /watchlist/test to downstream watchlist service', async () => {
      axios.mockResolvedValueOnce({ status: 200, data: { message: 'Watchlist Service Test' } });
      const res = await request(app).get('/watchlist/test');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: 'Watchlist Service Test' });
      expect(axios).toHaveBeenCalled();
    });
  });
});
