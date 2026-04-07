# AGENTS.md

## Cursor Cloud specific instructions

This is a React + TypeScript web application built with Vite. The project is a children's travel game called "Nana & Papa's Adventures."

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

### Notes

- The dev server runs on port 5173 by default. Use `--host 0.0.0.0` to expose it for browser testing.
- ESLint config is flat config format (`eslint.config.js`), not the legacy `.eslintrc` format.
- Vitest is configured in `vite.config.ts` (not a separate `vitest.config.ts`).
- Use `type` imports for TypeScript type-only imports (`import type { Foo }`) since `verbatimModuleSyntax` is enabled.
