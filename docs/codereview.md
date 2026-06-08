# Code Review

Date: 2026-06-08
Scope: entire repository (backend, frontend, Docker, scripts, tests, docs)

## Summary

The codebase is clean, small, and well-aligned with the "keep it simple" standard in
`AGENTS.md`. Structure matches the documented architecture, naming is consistent, and
there is solid test coverage on the backend and on frontend board logic. The MVP is
essentially functional.

The most important gaps are: a missing card-editing feature that the product
requirements explicitly call for, and a Docker run flow that silently discards the
SQLite database every time the app is restarted. Both are described below with concrete
actions.

Overall assessment: good for an MVP. Address the High items before calling the MVP
"done"; the Medium/Low items are cleanups.

---

## Remediation status (2026-06-08)

All Critical (none), High, and Medium items have been addressed. Low items remain open as
optional cleanups.

| ID | Item | Status |
|----|------|--------|
| H1 | Card editing missing | Fixed - inline edit added to `KanbanCard`, threaded through `KanbanColumn`/`KanbanBoard`, with a unit test |
| H2 | DB lost on container recreate | Fixed - `backend/data` volume mounted in all three start scripts |
| M1 | Redundant per-request DB init | Fixed - `initialize_database` now guarded to run once per DB path |
| M2 | Static route could shadow API routes | Fixed - comment added in `main.py` |
| M3 | Last-write-wins not documented | Fixed - "Known Limitations" added to `docs/RUNNING.md` |
| M4 | PLAN checklist out of sync | Fixed - `docs/PLAN.md` reconciled |
| L1-L7 | Low-priority cleanups | Open (optional) |

Test results after remediation:
- Backend: `uv run pytest` - 29 passed (includes the live OpenRouter connectivity test,
  which ran and passed with the configured key).
- Frontend: `npm test` (vitest) - 14 passed. `npm run lint` clean. `npm run build`
  (Next production build + TypeScript check) succeeds.

Note: a corrupted `backend/.venv` (broken `lib64` symlink, no Windows `Scripts/`) blocked
`uv run` and was removed and recreated with `uv sync`. Separately, the frontend test
suite was failing under Node 26 because its native experimental `localStorage` global
shadows jsdom's; a guarded in-memory polyfill was added in `src/test/setup.ts`. Both were
environment issues, not defects in the reviewed code.

---

## High priority

### H1. Card editing is required but not implemented

`AGENTS.md` states: "The cards on the Kanban board can be moved with drag and drop, and
edited." `docs/PLAN.md` Part 7 also lists saving "card edit" changes. The UI supports
column rename, add card, delete card, and drag, but there is **no way to edit an
existing card's title or details**.

Evidence:
- `frontend/src/components/KanbanCard.tsx:34-40` renders `card.title` and `card.details`
  as static text only.
- `frontend/src/components/KanbanBoard.tsx` has handlers for rename, add, delete, and
  drag, but none for editing a card.
- A repo-wide search for "edit" in `frontend/src` returns only the AI sidebar's
  placeholder copy.

Note: the AI sidebar can edit cards via chat, and `CLAUDE.md` describes
`KanbanBoard.tsx` as having "inline card editing" — that description is inaccurate for
direct UI editing.

Action: add inline editing of card title/details (mirroring the existing column-rename
input pattern), wire an `onEditCard` handler through `KanbanBoard` ->
`KanbanColumn` -> `KanbanCard`, and persist via the existing `onBoardChange` flow. Add a
unit test alongside the existing add/remove test in `KanbanBoard.test.tsx`.

### H2. SQLite data is lost on every container recreate

The start scripts run the container without a volume mount, and `start-windows.ps1`
does `docker rm -f` followed by `docker run` on every invocation. The database lives
inside the container at `/app/backend/data/pm.sqlite3`, so each start produces a fresh
container and resets the board to the default.

Evidence:
- `scripts/start-windows.ps1:17-25` removes the existing container and runs a new one
  with no `-v` flag.
- `backend/data/` is excluded by both `.gitignore:132` and `.dockerignore`.
- `docs/PLAN.md:164` / `:191` claim "Board changes persist across backend restarts" and
  ask to "verify changes persist after ... restarting the container."

This contradicts the stated success criteria. `docker restart` would preserve data, but
the provided scripts do a full recreate.

Action: mount a host volume for the database, e.g. add
`-v "${PWD}/backend/data:/app/backend/data"` (and the equivalent in the macOS/Linux
scripts), or document explicitly that data is intentionally ephemeral. Recommend the
volume mount so the persistence claims in the docs hold.

---

## Medium priority

### M1. `get_board` / `update_board` re-initialize the database on every call

`database.py:128` and `database.py:146` call `initialize_database()` on every read and
write, in addition to the app lifespan hook (`main.py:24`) that already initializes on
startup. This runs `executescript` (CREATE TABLE IF NOT EXISTS, index creation, user and
board seeding) on every request.

It is correct but wasteful and adds redundant DB work per request. Since the lifespan
hook already initializes, the per-call initialization is defensive overhead the coding
standard ("no unnecessary defensive programming") discourages.

Action: rely on the lifespan initialization and remove the `initialize_database()` calls
from `get_board` and `update_board`. Keep one of them only if the standalone data-access
functions need to work without the app lifespan (e.g. in tests) — the tests currently
call `initialize_database()` themselves where needed, so removal is safe.

### M2. Static file route can shadow API routes / has no caching headers

`main.py:99` defines a catch-all `GET /{static_path:path}`. Route ordering currently
saves it (API routes are declared first), and the `is_relative_to` check guards against
path traversal, which is good. Two observations:

- Any future API route added *below* this handler would be silently shadowed. Consider a
  comment noting that all API routes must be declared before the catch-all.
- Static assets are served with default headers (no cache-control). For an MVP this is
  fine; note it if performance ever matters.

Action: add a short comment above the catch-all route documenting the ordering
requirement. Caching is optional for the MVP.

### M3. Board update is not atomic with respect to concurrent writers

The frontend saves the entire board on every change (`AuthenticatedKanban.tsx:79`), and
the AI path also writes the whole board (`ai_chat.py:35`). If a manual edit and an AI
edit overlap, last-write-wins silently overwrites the other. `docs/PLAN.md` explicitly
scopes out conflict handling for the MVP, so this is acceptable — but worth recording as
a known limitation.

Action: no code change required. Note the limitation in the docs (it is partially noted
in PLAN Part 7 already).

### M4. PLAN checklist has unchecked items presented as done

`docs/PLAN.md` leaves several boxes unchecked (e.g. lines 216, 227-230, 268, 298) for
real-network AI verification and some E2E tests, while the "Overall Definition of Done"
implies completion. This makes it hard to know true status.

Action: reconcile the checklist with reality — either complete and check the items
(real OpenRouter smoke test, the e2e AI test) or move them to an explicit "deferred"
section.

---

## Low priority / cleanups

### L1. Drag listeners cover the whole card including the Remove button

`KanbanCard.tsx:29` spreads `{...listeners}` on the `<article>`, so the Remove button is
inside the drag handle. The `PointerSensor` activation distance of 6px
(`KanbanBoard.tsx:38`) means a plain click still fires the button, so this works in
practice. Still, attaching listeners to a dedicated drag handle (or stopping propagation
on the button) is more robust.

Action: optional. If touched, add `onPointerDown={(e) => e.stopPropagation()}` to the
Remove button, or introduce a drag handle.

### L2. `cardsById` useMemo is a no-op

`KanbanBoard.tsx:42`: `const cardsById = useMemo(() => board.cards, [board.cards])` just
returns the same reference it depends on. The memo adds no value.

Action: replace with `const cardsById = board.cards;` or use `board.cards` directly.

### L3. `.env` parser is minimal

`ai.py:29-34` parses `.env` line by line. It does not handle `export KEY=...`, inline
comments, or multiline values. For this project's single-key `.env` it is fine and
matches the "keep it simple" standard. Noting only so it is a conscious choice.

Action: none, unless `.env` grows. Consider a comment that this is a deliberately
minimal parser.

### L4. Frontend `initialData` duplicates backend `DEFAULT_BOARD`

`frontend/src/lib/kanban.ts:18` and `backend/app/database.py:11` define the same default
board independently. The frontend value is now only used by tests
(`KanbanBoard.test.tsx`), since the live board comes from the API. Drift between the two
is harmless but possible.

Action: optional. Keep `initialData` as a test fixture, or add a comment that it is
test-only and the backend `DEFAULT_BOARD` is the source of truth.

### L5. `board_changed` comparison relies on dict equality

`ai_chat.py:33`: `updated_board != board` decides whether to persist. This is correct for
JSON-derived dicts, but key ordering or whitespace differences from the model do not
matter here because both sides are parsed dicts. Fine as-is; documenting the reasoning in
a one-line comment would help future readers.

Action: optional comment.

### L6. Tracked test artifact

`frontend/test-results/.last-run.json` is committed (visible in `git ls-files`) while
`frontend/test-results` is otherwise ignored via `.dockerignore`. This looks like an
accidental check-in.

Action: remove the file from version control and ensure `frontend/.gitignore` covers
`test-results/`.

### L7. `AiTestRequest` / `/api/ai/test` is a diagnostic endpoint shipped to production

`main.py:68` exposes `POST /api/ai/test`, which triggers a real OpenRouter call with an
arbitrary prompt. It is useful for connectivity checks but is also an unauthenticated way
to spend API credits.

Action: acceptable for a local-only MVP. If the app is ever exposed beyond localhost,
gate or remove this endpoint.

---

## What is good

- Clear separation of concerns: `ai.py` (transport), `ai_chat.py` (orchestration/parsing),
  `database.py` (persistence), `main.py` (routing).
- Robust AI response parsing with graceful fallbacks (fenced JSON, plain text, invalid
  unicode, wrong schema) and matching unit tests in `test_ai_chat.py`.
- Board validation (`database.py:160`) is thorough: shape, duplicate card placement, and
  dangling references, and it is reused for AI updates.
- Path-traversal guard on static serving (`main.py:104`).
- API key stays server-side; never exposed to the frontend.
- Tests use `PM_DB_PATH` with temp dirs rather than hardcoded paths, per the documented
  convention.
- Color scheme is centralized as CSS variables in `globals.css` and used consistently.
- Multi-stage Dockerfile builds the frontend and copies only the static output into the
  backend image.

---

## Suggested action order

1. H1 - implement card editing (requirement gap).
2. H2 - add a volume mount so the DB persists, or document ephemerality.
3. M1 - remove redundant per-request `initialize_database()` calls.
4. M4 - reconcile the PLAN checklist with actual status.
5. L6 - untrack `frontend/test-results/.last-run.json`.
6. Remaining Medium/Low items as cleanup, opportunistically.
