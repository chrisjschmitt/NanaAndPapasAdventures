# Nana & Papa's Adventures

A puzzle game for children where kids match photos to clues and hints, revealing a hidden prize image as they solve each piece. Built with React, TypeScript, and Vite, deployed on Vercel.

## How It Works

The game presents a **3×3 board of colorful tiles** covering a hidden prize image. Each tile hides a clue — tap a tile to reveal it, then pick the matching photo from a grid of choices. Get it right and the tile fades away to reveal a piece of the prize image underneath (with a celebration sound!). Get it wrong and you'll get a helpful hint. After solving all 9 pieces, the full prize image is revealed seamlessly.

### Key Gameplay Features

- **Reveal board** — colorful gradient tiles cover a prize image like a scratch-off card
- **Clues, hints, and fun facts** — each piece has a clue (shown to the child), a hint (shown on wrong answer), and an optional fun fact (shown after correct answer)
- **Prize image** — revealed piece by piece as tiles are solved; dimmed initially, full brightness when complete with gaps removed for a seamless photo
- **Photo zoom** — tap the 🔍 button on any answer photo to see it full-size before choosing
- **Tap to explore** — after solving a piece, tap it to see the individual photo for that cell
- **Randomized rounds** — each game randomly picks up to 9 cells from the puzzle's full pool, and shuffles both tile order and photo grid order
- **Custom sounds** — optional WAV file per puzzle (default celebration) or per cell, with synthesized fireworks as the fallback
- **Replay** — button appears after the first guess; re-shuffles cells and photos for a fresh round
- **Shareable links** — each puzzle has a direct URL (`/play/{puzzleId}`) that can be sent to anyone

### Included Puzzle: Cruise Ship Adventure

The app ships with a built-in cruise-themed puzzle featuring 9 items you'd find on a cruise ship (Swimming Pool, Anchor, Lifeboat, Ocean Sunset, Buffet, Captain, Dolphin, Lighthouse, Telescope).

## Admin Panel

Navigate to `/admin` or click the **⚙️ Admin** button on the home screen. Login requires the `ADMIN_PASSWORD` environment variable.

### Puzzle Management

- **Create puzzles** manually — name it, add cells one at a time with photo upload, clue, hint, fun fact, and optional sound per cell
- **Import from CSV** — bulk-create a puzzle from a CSV file
- **Export to CSV** — select one or more puzzles and download as CSV
- **Edit puzzles** — update any field, upload new photos, reorder cells with ↑↓ arrows
- **Delete puzzles** — remove puzzles you no longer need
- **Copy shareable link** — 📋 button copies the puzzle's direct play URL to clipboard
- **Partial save** — save at any time, even with incomplete cells; come back later to finish
- **Under construction indicator** — puzzles with fewer than 9 ready cells show 🚧 badge

### Per-Puzzle Settings

- **Prize image** — upload a photo revealed as the child solves pieces
- **Celebration sound** — default WAV played on correct answer (falls back to synthesized fireworks)
- **Unlimited cells** — add more than 9 cells; each round randomly picks 9

### Per-Cell Fields

| Field | Required | Shown to Player | Description |
|-------|----------|-----------------|-------------|
| Subject | No | No | Admin-only label shown as a blue badge on the cell header |
| Photo | Yes (for playable cell) | Yes (in answer grid) | Uploaded image for the answer grid |
| Photo label | No | No (labels hidden in game) | Used internally |
| Clue | Yes | Yes | The riddle the child reads |
| Hint | Yes | Yes (on wrong answer) | Helpful hint shown when wrong photo is chosen |
| Fun Fact | No | Yes (after correct answer) | Displayed in a golden popup after solving |
| Recommended Sound | No | No | Admin-only note from CSV import suggesting which sound to use |
| Sound (WAV) | No | Yes (on correct answer) | Per-cell celebration sound; overrides puzzle default |

### CSV Import/Export

**Format:** `subject, clue, hint, fun fact, recommended sound`

```csv
subject, clue, hint, fun fact, recommended sound
Swimming Pool, "Splash! Where do you cool off?", "Look for the water!", "Pools can hold 100K gallons", splash.wav
Anchor, "This heavy thing keeps the ship still!", "Drops into the ocean", "Anchors weigh up to 10 tons", clank.wav
```

- Header row is auto-detected and skipped
- Quoted fields with commas are handled correctly
- Puzzle name defaults to the filename on import
- Multi-puzzle export separates each puzzle with a comment line

## Shareable Links

Each puzzle can be played via a direct URL:

```
https://your-app.vercel.app/play/cruise-ship-adventure
```

The admin panel shows a **📋 Link** button per puzzle that copies the URL to clipboard. Send it to anyone — they'll land straight in that puzzle, skipping the selector.

## Development

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Type-check and production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run preview` | Preview production build locally |

### Tech Stack

- **React 19** + **TypeScript 6**
- **Vite 8** — dev server and bundler
- **Vitest** + **Testing Library** — automated tests
- **ESLint 9** — flat config with React hooks and refresh plugins
- **Vercel Blob** (private) — server-side storage for photos, sounds, and puzzle data
- **Web Audio API** — synthesized fireworks fallback + custom WAV playback
- **CSS Grid** — responsive 3×3 puzzle board

### API Routes (`/api/`)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth` | POST | Admin login |
| `/api/puzzles` | GET, POST, PUT, DELETE | Puzzle CRUD |
| `/api/upload-image` | POST | Upload image/sound to Vercel Blob |
| `/api/blob` | GET | Proxy private blob content to browser |

## Deployment

Deployed to **Vercel** with private Blob storage. Configuration is in `vercel.json`.

### Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `ADMIN_PASSWORD` | Password for the admin panel login |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token (private store) |

Set these in the Vercel dashboard under Project Settings → Environment Variables.

### Deploy

- Push to `main` triggers automatic deployment
- Vercel auto-detects the Vite framework and runs `npm run build`
- SPA rewrite rule handles client-side routing (`/play/*`, `/admin`)

To deploy manually via CLI:

```bash
vercel --prod
```
