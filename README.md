# Nana & Papa's Adventures

A puzzle game for children where kids solve clue-based jigsaw puzzles by matching photos to riddles. Built with React, TypeScript, and Vite.

## How It Works

The game presents a **3×3 jigsaw puzzle board** with interlocking pieces. Each piece hides a clue — tap a piece to reveal it, then pick the matching photo from a grid of 9 choices. Get it right and fireworks light up the screen (with sound!). Get it wrong and you'll get a helpful hint to try again.

### Included Puzzle: Cruise Ship Adventure

The app ships with a ready-to-play cruise-themed puzzle featuring 9 items you'd find on a cruise ship:

| Piece | Clue | Answer |
|-------|------|--------|
| 1 | "Splash! Where do you cool off on a hot day at sea?" | Swimming Pool |
| 2 | "This heavy metal thing keeps the ship from floating away!" | Anchor |
| 3 | "If everyone needs to leave the ship, they climb into these!" | Lifeboat |
| 4 | "The sky turns orange and pink when the day says goodbye!" | Ocean Sunset |
| 5 | "All-you-can-eat! A table full of yummy food!" | Buffet |
| 6 | "This person wears a fancy uniform and drives the whole ship!" | Captain |
| 7 | "A friendly sea creature that loves to jump and play beside the ship!" | Dolphin |
| 8 | "A tall tower on the shore with a bright light to guide ships!" | Lighthouse |
| 9 | "Look through this to see faraway islands and stars!" | Telescope |

## Features

- **Jigsaw puzzle pieces** with SVG-based interlocking tabs and blanks
- **Clue overlay** — full-screen clue with a 3×3 photo answer grid
- **Fireworks + sound** — canvas particle animation with synthesized pops, crackles, and whistles (Web Audio API, no audio files)
- **Hints** — wrong answers show a helpful hint to guide the child
- **Progress tracking** — solved pieces persist via localStorage
- **Admin panel** — create new puzzles, upload/manage photos, write clues and hints
- **Photo library** — upload photos from your device, stored in IndexedDB

## Admin Panel

Click the **⚙️ Admin** button on the home screen to access the admin panel, where you can:

- **Create new puzzles** with custom names, clues, hints, and photo assignments
- **Upload photos** to the library from your device
- **Edit existing puzzles** — update clues, hints, or swap photos
- **Delete puzzles or photos** you no longer need

Photo storage uses IndexedDB (browser-local), adapted from the [cjs_foto](https://github.com/chrisjschmitt/cjs_foto) project's upload/delete patterns.

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
- **IndexedDB** — browser-local storage for puzzles and photos
- **Web Audio API** — synthesized fireworks sound effects
- **SVG clip paths** — jigsaw piece shapes

## Deployment

Deployed to **Vercel**. Configuration is in `vercel.json`.

- Push to `main` triggers automatic deployment
- Vercel auto-detects the Vite framework and runs `npm run build`
- SPA rewrite rule ensures client-side routing works

To deploy manually via CLI:

```bash
vercel --prod
```
