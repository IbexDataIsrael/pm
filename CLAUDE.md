# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Kanban project management MVP: Next.js frontend (static export) served by a Python FastAPI backend, packaged in Docker. AI chat sidebar calls OpenRouter to answer questions and optionally update the board.

Color scheme (do not deviate): accent yellow `#ecad0a`, blue primary `#209dd7`, purple secondary `#753991`, dark navy `#032147`, gray text `#888888`.

Coding standards: simple, no over-engineering, no unnecessary defensive programming, no emojis ever.

## Running the app

The app runs in Docker at `http://localhost:8000`. Start/stop scripts are in `scripts/`:

```powershell
# Windows
.\scripts\start-windows.ps1
.\scripts\stop-windows.ps1
```

Requires `OPENROUTER_API_KEY` in a `.env` file at the project root for AI features.

Smoke checks after start: `http://localhost:8000/` (Kanban board), `http://localhost:8000/api/health` (`{"status":"ok"}`).

## Development commands

**Frontend** (from `frontend/`):

```sh
npm run dev          # local dev server (not connected to backend)
npm run build        # static export to out/
npm test             # unit tests (vitest)
npm run test:e2e     # end-to-end tests (playwright)
npm run lint         # eslint
```

Run a single vitest test file: `npx vitest run src/components/KanbanBoard.test.tsx`

**Backend** (from `backend/`):

```sh
uv run pytest                        # all tests
uv run pytest tests/test_main.py     # single test file
uv run uvicorn app.main:app --reload # local dev (no frontend)
```

Backend tests use `PM_DB_PATH` env var to point to a temp database — do not hardcode paths in tests.

## Architecture

### Request flow

Browser → FastAPI backend at port 8000 → `/api/*` routes handled by Python, all other paths served as static files from `backend/static/` (the compiled Next.js output).

The frontend is built with `next export` and copied into `backend/static/` during the Docker build. There is no separate frontend server in production.

### Backend (`backend/app/`)

- `main.py` — FastAPI app, all API routes, lifespan hook calls `initialize_database()`
- `database.py` — SQLite access: `initialize_database()`, `get_board()`, `update_board()`, `validate_board()`
- `ai.py` — OpenRouter HTTP calls, reads `OPENROUTER_API_KEY` from env then from project root `.env`
- `ai_chat.py` — AI chat logic: builds prompt with current board JSON, parses structured AI response `{message, board}`, persists valid board updates

**Database**: SQLite at `backend/data/pm.sqlite3` (created on startup). Schema: `users` table + `boards` table with one board per user stored as full JSON. The MVP hardcodes username `user`. DB path can be overridden with `PM_DB_PATH` env var.

**Board validation** (`validate_board` in `database.py`): enforces that `columns` is an array, `cards` is an object, card IDs are unique per column, and all `cardIds` reference existing cards.

### Frontend (`frontend/src/`)

- `app/page.tsx` — root page, renders `AuthenticatedKanban`
- `components/AuthenticatedKanban.tsx` — handles login state, board fetching after login, board refresh when AI updates it
- `components/KanbanBoard.tsx` — Kanban UI with dnd-kit drag and drop, inline card editing, column renaming
- `components/AiChatSidebar.tsx` — chat sidebar, keeps local history for the page session, refreshes board when `boardChanged: true`
- `lib/boardApi.ts` — all API calls: `fetchBoard`, `saveBoard`, `sendAiChatMessage`
- `lib/kanban.ts` — `BoardData` type and board manipulation helpers

**Authentication**: hardcoded entirely in the frontend (username `user`, password `password`). The backend has no auth checks — it always serves the MVP user's board.

**Board data flow**: login → `fetchBoard()` → render Kanban → any change (drag, edit, rename) → update local state immediately → `saveBoard()` → persist to backend.

### AI chat flow

Frontend sends `{message, history}` to `POST /api/ai/chat`. Backend fetches current board, builds prompt with board JSON + history (last 10 messages), calls OpenRouter with `openai/gpt-oss-120b`, expects JSON response `{message: string, board: null | BoardData}`. If board is present and valid, it is persisted and `boardChanged: true` is returned to the frontend, which then re-fetches the board.

## Key docs

- `AGENTS.md` — product requirements, technical decisions, coding standards
- `docs/PLAN.md` — implementation plan with phase-by-phase checklist (check here for current status)
- `docs/DATABASE.md` — database schema design
- `docs/RUNNING.md` — running the app locally
