# AGENTS.md

## Cursor Cloud specific instructions

This is a React + TypeScript web application built with Vite. The project is a children's puzzle game called "Nana & Papa's Adventures."

### Quick reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Type check | `npx tsc -b` |
| Tests | `npm test` |
| Tests (watch) | `npm run test:watch` |
| Build | `npm run build` |

### Architecture

- **Puzzle game**: 3x3 grid of puzzle pieces, each with a clue. Clicking opens a full-screen overlay with the clue and a 3x3 photo grid. Correct answer triggers fireworks; wrong answer shows a hint.
- **Admin panel**: Create/edit puzzles, manage photo library. Accessed via the Admin button on the home screen.
- **Storage**: Uses IndexedDB (`src/lib/storage.ts`) for puzzle data and photos. Pattern adapted from the `cjs_foto` repository's Vercel Blob approach but uses browser-local storage instead.
- **Default puzzle**: "Cruise Ship Adventure" is seeded on first load from `src/data/defaultPuzzle.ts`.

### Notes

- The dev server runs on port 5173 by default. Use `--host 0.0.0.0` to expose it for browser testing.
- ESLint config is flat config format (`eslint.config.js`), not the legacy `.eslintrc` format.
- Vitest is configured in `vite.config.ts` (not a separate `vitest.config.ts`).
- Use `type` imports for TypeScript type-only imports (`import type { Foo }`) since `verbatimModuleSyntax` is enabled.
- SVG data URIs with emoji must use `encodeURIComponent`, not `btoa` (Unicode limitation).
- The `react-hooks/set-state-in-effect` lint rule is active — derive state with `useMemo` or use lazy initializers instead of calling `setState` in effects.

### Deployment

- Deployed to **Vercel** as a Vite SPA. Config in `vercel.json` (framework: vite, SPA rewrite rule).
- Vercel auto-detects Vite and runs `npm run build` → serves from `dist/`.
- Two deployment options: (1) Connect the GitHub repo in the Vercel dashboard for automatic deploys, or (2) use `vercel --prod --token $VERCEL_TOKEN` from CLI.
