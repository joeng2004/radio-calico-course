# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# RadioCalico Project

## Stack
- Web server: Express.js (port 3000) + better-sqlite3
- Legacy prototype: Flask (port 5000) + SQLite — not integrated with Express

## Development Server
- Start command: `npm start &` (or `npm run dev` for watch mode)
- **Never run `npm start` in the foreground** — it will block. Run in the background if a restart is needed.
- Assume the server is already running unless told otherwise.

## Architecture

RadioCalico is a live HLS radio streaming app. The Express server (`server.js`) serves the frontend and handles a song ratings API. The Flask app (`app.py`) is a disconnected prototype and not part of the active flow.

**Request flow:**
1. Express serves `public/index.html` — a radio player using HLS.js
2. Player streams from a CloudFront HLS endpoint (`*.cloudfront.net/hls/live.m3u8`)
3. Frontend polls for metadata and submits ratings via `/api/ratings`
4. Ratings are stored in `dev.db` (SQLite) using better-sqlite3

**API endpoints (Express):**
- `GET /api/health`
- `GET /api/ratings?song=<key>`
- `POST /api/ratings` — body: `{ song_key, rating }` (1 or -1)

User identity is derived from a SHA256 hash of IP + user-agent. Ratings use UPSERT logic keyed on `(song_key, user_id)`.

## File Structure

```
radiocalico/
├── server.js                  # Express server (port 3000), ratings API
├── package.json               # Node dependencies
├── dev.db                     # SQLite database (ratings)
├── app.py                     # Legacy Flask prototype (disconnected)
├── index.html                 # Old prototype frontend (unused)
├── public/
│   ├── index.html             # Active frontend — HLS player + ratings UI
│   ├── style.css              # Stylesheet for index.html
│   └── RadioCalicoLogoTM.png  # Logo asset
├── RadioCalico_Style_Guide.txt
├── RadioCalicoLayout.png
├── RadioCalicoLogoTM.png
├── stream_URL.txt             # CloudFront HLS endpoint
├── README.md
└── .github/workflows/
    ├── claude.yml             # Claude PR Assistant
    └── claude-code-review.yml # Claude Code Review
```

## Style Guide
Brand colors and typography are documented in `RadioCalico_Style_Guide.txt`. Follow these when building UI:
- Colors: Mint (#D8F2D5), Forest Green (#1F4E23), Teal (#38A29D), Calico Orange (#EFA63C), Charcoal (#231F20)
- Fonts: Montserrat (headings), Open Sans (body)
