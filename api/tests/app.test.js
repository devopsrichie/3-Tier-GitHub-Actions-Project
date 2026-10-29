const request = require('supertest');

jest.mock('../src/db', () => ({ query: jest.fn(), getConnection: jest.fn() }));
const pool = require('../src/db');
const app = require('../src/app');
const { signToken } = require('../src/middleware/auth');

const bidder = signToken({ id: 2, name: 'Thabo', email: 'thabo@example.com', role: 'bidder' });

afterEach(() => jest.clearAllMocks());

describe('health & metrics', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /metrics exposes Prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('auction_api_http_requests_total');
  });
});

describe('auth validation', () => {
  it('rejects registration without a password', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@b.co' });
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects short passwords', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'A', email: 'a@b.co', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('auctions', () => {
  it('lists auctions', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, title: 'Sandton Apartment', status: 'live' }]]);
    const res = await request(app).get('/api/auctions');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('rejects an unknown status filter', async () => {
    const res = await request(app).get('/api/auctions?status=foo');
    expect(res.status).toBe(400);
  });

  it('requires login to bid', async () => {
    const res = await request(app).post('/api/auctions/1/bids').send({ amount: 100 });
    expect(res.status).toBe(401);
  });

  it('only admins can create auctions', async () => {
    const res = await request(app).post('/api/auctions')
      .set('Authorization', `Bearer ${bidder}`).send({ title: 'x' });
    expect(res.status).toBe(403);
  });

  it('rejects a bid below the minimum', async () => {
    const now = Date.now();
    const conn = {
      beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([[{
          id: 1, starting_price: 1000000, bid_increment: 10000,
          starts_at: new Date(now - 3600e3), ends_at: new Date(now + 3600e3),
        }]])
        .mockResolvedValueOnce([[{ highest: 1200000 }]]),
    };
    pool.getConnection.mockResolvedValueOnce(conn);

    const res = await request(app).post('/api/auctions/1/bids')
      .set('Authorization', `Bearer ${bidder}`).send({ amount: 1205000 });
    expect(res.status).toBe(400);
    expect(res.body.minimum).toBe(1210000);
    expect(conn.rollback).toHaveBeenCalled();
  });

  it('accepts a valid bid', async () => {
    const now = Date.now();
    const conn = {
      beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([[{
          id: 1, starting_price: 1000000, bid_increment: 10000,
          starts_at: new Date(now - 3600e3), ends_at: new Date(now + 3600e3),
        }]])
        .mockResolvedValueOnce([[{ highest: null }]])
        .mockResolvedValueOnce([{ insertId: 7 }]),
    };
    pool.getConnection.mockResolvedValueOnce(conn);

    const res = await request(app).post('/api/auctions/1/bids')
      .set('Authorization', `Bearer ${bidder}`).send({ amount: 1000000 });
    expect(res.status).toBe(201);
    expect(conn.commit).toHaveBeenCalled();
  });
});
