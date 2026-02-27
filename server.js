const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const app = express();
const db = new Database(process.env.DB_PATH || 'dev.db');

app.set('trust proxy', true);
app.use(express.json());
app.use(express.static('public'));

// Ratings table
db.exec(`
  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_key TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    UNIQUE(song_key, user_id)
  )
`);

function getUserId(req) {
  const raw = (req.ip || '') + (req.headers['user-agent'] || '');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config', (req, res) => {
  res.json({ env: process.env.APP_ENV || 'prod' });
});

app.get('/api/ratings', (req, res) => {
  const song = req.query.song;
  if (!song) return res.status(400).json({ error: 'missing song' });
  const userId = getUserId(req);
  const rows = db.prepare('SELECT rating, user_id FROM ratings WHERE song_key = ?').all(song);
  const up = rows.filter(r => r.rating === 1).length;
  const down = rows.filter(r => r.rating === -1).length;
  const mine = rows.find(r => r.user_id === userId);
  res.json({ up, down, userRating: mine ? mine.rating : 0 });
});

app.post('/api/ratings', (req, res) => {
  const { song, rating } = req.body;
  if (!song || ![1, -1].includes(rating)) return res.status(400).json({ error: 'invalid' });
  const userId = getUserId(req);
  db.prepare(`
    INSERT INTO ratings (song_key, user_id, rating) VALUES (?, ?, ?)
    ON CONFLICT(song_key, user_id) DO UPDATE SET rating = excluded.rating
  `).run(song, userId, rating);
  const rows = db.prepare('SELECT rating FROM ratings WHERE song_key = ?').all(song);
  const up = rows.filter(r => r.rating === 1).length;
  const down = rows.filter(r => r.rating === -1).length;
  res.json({ up, down, userRating: rating });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Listening on ${HOST}:${PORT}`);
  });
}

module.exports = { app, db };
