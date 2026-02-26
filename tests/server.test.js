import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, db } from '../server.js';

beforeEach(() => {
  db.exec('DELETE FROM ratings');
});

afterAll(() => {
  db.close();
});

// Helper: insert a rating directly bypassing HTTP
function insertRating(songKey, userId, rating) {
  db.prepare(`
    INSERT INTO ratings (song_key, user_id, rating) VALUES (?, ?, ?)
    ON CONFLICT(song_key, user_id) DO UPDATE SET rating = excluded.rating
  `).run(songKey, userId, rating);
}

describe('GET /api/ratings', () => {
  it('returns 400 when song param is missing', async () => {
    const res = await request(app).get('/api/ratings');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('missing song');
  });

  it('returns zero counts and userRating 0 for unrated song', async () => {
    const res = await request(app)
      .get('/api/ratings?song=artist%7Ctitle')
      .set('user-agent', 'test-agent');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ up: 0, down: 0, userRating: 0 });
  });

  it('returns correct up/down counts', async () => {
    insertRating('a|b', 'user1', 1);
    insertRating('a|b', 'user2', 1);
    insertRating('a|b', 'user3', -1);
    const res = await request(app).get('/api/ratings?song=a%7Cb');
    expect(res.body.up).toBe(2);
    expect(res.body.down).toBe(1);
  });

  it('reflects the requesting user\'s rating', async () => {
    // Two requests from same IP+UA will share the same derived user_id
    const agent = request.agent(app);
    // First POST to establish a rating
    await agent
      .post('/api/ratings')
      .set('user-agent', 'ua-test')
      .send({ song: 'x|y', rating: -1 });

    const res = await agent
      .get('/api/ratings?song=x%7Cy')
      .set('user-agent', 'ua-test');
    expect(res.body.userRating).toBe(-1);
  });
});

describe('POST /api/ratings', () => {
  it('returns 400 when song is missing', async () => {
    const res = await request(app).post('/api/ratings').send({ rating: 1 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is 0', async () => {
    const res = await request(app).post('/api/ratings').send({ song: 'a|b', rating: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is 2', async () => {
    const res = await request(app).post('/api/ratings').send({ song: 'a|b', rating: 2 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is a string', async () => {
    const res = await request(app).post('/api/ratings').send({ song: 'a|b', rating: 'up' });
    expect(res.status).toBe(400);
  });

  it('inserts a new rating and returns updated counts', async () => {
    const res = await request(app)
      .post('/api/ratings')
      .set('user-agent', 'ua-new')
      .send({ song: 'new|song', rating: 1 });
    expect(res.status).toBe(200);
    expect(res.body.up).toBe(1);
    expect(res.body.down).toBe(0);
    expect(res.body.userRating).toBe(1);
  });

  it('UPSERT: same user flipping vote updates without double-counting', async () => {
    const agent = request.agent(app);
    await agent.post('/api/ratings').set('user-agent', 'ua-flip').send({ song: 'flip|song', rating: 1 });
    const res = await agent.post('/api/ratings').set('user-agent', 'ua-flip').send({ song: 'flip|song', rating: -1 });
    expect(res.body.up).toBe(0);
    expect(res.body.down).toBe(1);
    expect(res.body.userRating).toBe(-1);
  });

  it('aggregates ratings from multiple users correctly', async () => {
    insertRating('multi|song', 'u1', 1);
    insertRating('multi|song', 'u2', 1);
    insertRating('multi|song', 'u3', -1);
    const res = await request(app)
      .post('/api/ratings')
      .set('user-agent', 'ua-u4')
      .send({ song: 'multi|song', rating: 1 });
    expect(res.body.up).toBe(3);
    expect(res.body.down).toBe(1);
  });
});
