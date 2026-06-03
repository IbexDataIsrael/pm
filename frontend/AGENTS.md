# Frontend

This folder contains the existing Next.js Kanban demo for the Project Management MVP.

Structure:
- `src/app/page.tsx` renders the Kanban board at `/`.
- `src/app/layout.tsx` defines app metadata, global fonts, and the root layout.
- `src/app/globals.css` contains global styling and theme variables.
- `src/components/` contains the board, column, card, preview, and new-card form components.
- `src/lib/kanban.ts` contains the initial board data and board helper functions.
- `src/test/` contains Vitest setup files.
- `tests/` contains Playwright end-to-end tests.

Current behavior:
- The app is a frontend-only demo behind a dummy local login.
- The MVP credentials are username `user` and password `password`.
- Board state lives in React state.
- Users can rename columns, add cards, delete cards, and drag cards between columns.
- There is no backend API usage, persistence, or AI chat yet.

Commands:

```sh
npm install
npm run dev
npm run build
npm run test:unit
npm run test:e2e
```

Notes:
- `next.config.ts` uses `output: "export"` so the app can be built as static files.
- Docker builds this frontend and copies `out/` into the FastAPI backend image.
- Keep changes simple and preserve the existing Kanban behavior unless a later plan phase requires otherwise.
