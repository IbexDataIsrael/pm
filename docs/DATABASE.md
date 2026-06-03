# Database Design

This document proposes the SQLite persistence model for the Project Management MVP. It is a design document only; backend database code should not be implemented until this approach is approved.

## Goals

- Use SQLite as the local database.
- Create the database automatically if it does not exist.
- Support the current MVP credentials, `user` and `password`.
- Keep one Kanban board per signed-in user for the MVP.
- Store each Kanban board as JSON.
- Keep the schema simple while allowing multiple users later.

## Database File

Use a single SQLite file owned by the backend container:

```text
backend/data/pm.sqlite3
```

For Docker, this can initially live inside the container filesystem. When persistence outside container rebuilds is needed, mount `backend/data` or a Docker volume in the start scripts.

The backend should create the parent directory and database file on startup if they do not already exist.

## Schema

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  board_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards (user_id);
```

## Table Notes

`users` stores one row per user. For the MVP, the backend should ensure there is one user with username `user`. `password_hash` can stay nullable because the current login is hardcoded and local-only. If Part 6 decides to validate credentials in the backend, store a simple password hash here rather than plain text.

`boards` stores exactly one board per user. The `UNIQUE` constraint on `user_id` enforces the MVP rule of one board per signed-in user while still allowing multiple users later.

`board_json` stores the complete Kanban board as JSON text. SQLite JSON functions are not required for the MVP because the app reads and writes the whole board.

## Board JSON Shape

The persisted JSON should match the current frontend `BoardData` shape:

```json
{
  "columns": [
    {
      "id": "col-backlog",
      "title": "Backlog",
      "cardIds": ["card-1", "card-2"]
    }
  ],
  "cards": {
    "card-1": {
      "id": "card-1",
      "title": "Align roadmap themes",
      "details": "Draft quarterly themes with impact statements and metrics."
    }
  }
}
```

Rules:

- `columns` is an ordered array and is the source of truth for column order.
- Each column has a stable `id`, editable `title`, and ordered `cardIds`.
- `cards` is an object keyed by card id.
- Each card has `id`, `title`, and `details`.
- Every `cardIds` entry should point to an existing key in `cards`.
- Card ids should not appear in more than one column.

This shape stores column names, card content, card ordering, and card movement without needing extra relational tables.

## Default Board

When a user exists but does not yet have a board, the backend should insert a default board using the current frontend demo data:

```json
{
  "columns": [
    { "id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"] },
    { "id": "col-discovery", "title": "Discovery", "cardIds": ["card-3"] },
    { "id": "col-progress", "title": "In Progress", "cardIds": ["card-4", "card-5"] },
    { "id": "col-review", "title": "Review", "cardIds": ["card-6"] },
    { "id": "col-done", "title": "Done", "cardIds": ["card-7", "card-8"] }
  ],
  "cards": {
    "card-1": {
      "id": "card-1",
      "title": "Align roadmap themes",
      "details": "Draft quarterly themes with impact statements and metrics."
    },
    "card-2": {
      "id": "card-2",
      "title": "Gather customer signals",
      "details": "Review support tags, sales notes, and churn feedback."
    },
    "card-3": {
      "id": "card-3",
      "title": "Prototype analytics view",
      "details": "Sketch initial dashboard layout and key drill-downs."
    },
    "card-4": {
      "id": "card-4",
      "title": "Refine status language",
      "details": "Standardize column labels and tone across the board."
    },
    "card-5": {
      "id": "card-5",
      "title": "Design card layout",
      "details": "Add hierarchy and spacing for scanning dense lists."
    },
    "card-6": {
      "id": "card-6",
      "title": "QA micro-interactions",
      "details": "Verify hover, focus, and loading states."
    },
    "card-7": {
      "id": "card-7",
      "title": "Ship marketing page",
      "details": "Final copy approved and asset pack delivered."
    },
    "card-8": {
      "id": "card-8",
      "title": "Close onboarding sprint",
      "details": "Document release notes and share internally."
    }
  }
}
```

## Initialization Flow

On backend startup or first database access:

1. Ensure `backend/data` exists.
2. Connect to `backend/data/pm.sqlite3`.
3. Enable foreign keys with `PRAGMA foreign_keys = ON`.
4. Run `CREATE TABLE IF NOT EXISTS` statements.
5. Ensure the MVP user row exists for username `user`.
6. Ensure that user has one board row, inserting the default board JSON if missing.

## Migration Approach

For the MVP, use simple idempotent schema initialization with `CREATE TABLE IF NOT EXISTS`.

If later phases need schema changes, add a small `schema_migrations` table:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Do not add migration tooling until a real schema change requires it.

## Validation for Part 6

Before saving `board_json`, the backend should validate the minimum board shape:

- Top-level value is an object.
- `columns` is an array.
- `cards` is an object.
- Each column has string `id`, string `title`, and array `cardIds`.
- Each card has string `id`, string `title`, and string `details`.
- Card ids referenced by columns exist in `cards`.
- No card id is listed in more than one column.

This is enough to protect the app from malformed requests without over-engineering the MVP.

## Approval Gate

Please approve this database design before Part 6 starts. Part 6 should implement this schema, initialization flow, default board creation, and backend board API routes.
