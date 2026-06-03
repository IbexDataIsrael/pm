# Backend

This folder contains the FastAPI backend for the Project Management MVP.

Current Part 2 scaffold:
- `app/main.py` defines the FastAPI app.
- `GET /api/health` returns a basic health response.
- `GET /api/board` returns the MVP user's persisted Kanban board.
- `PUT /api/board` validates and persists the MVP user's Kanban board.
- `app/database.py` manages SQLite initialization, default board creation, board persistence, and board validation.
- `/` serves `static/index.html`.
- Other static paths are served from `static/` so the exported Next.js app can load its assets.
- `tests/` contains backend smoke tests.
- `pyproject.toml` uses `uv` for dependency management.

Run tests from this folder with:

```sh
uv run pytest
```