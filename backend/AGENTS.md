# Backend

This folder contains the FastAPI backend for the Project Management MVP.

Current backend structure:
- `app/main.py` defines the FastAPI app.
- `GET /api/health` returns a basic health response.
- `GET /api/board` returns the MVP user's persisted Kanban board.
- `PUT /api/board` validates and persists the MVP user's Kanban board.
- `POST /api/ai/test` verifies backend OpenRouter connectivity with a simple prompt.
- `POST /api/ai/chat` sends the current board and chat context to AI, then persists valid structured board updates.
- `app/ai.py` manages OpenRouter request construction, API key loading, and chat calls.
- `app/ai_chat.py` builds the structured Kanban prompt, parses AI JSON, validates board updates, and coordinates persistence.
- `app/database.py` manages SQLite initialization, default board creation, board persistence, and board validation.
- `/` serves `static/index.html`.
- Other static paths are served from `static/` so the exported Next.js app can load its assets.
- `tests/` contains backend smoke tests.
- `pyproject.toml` uses `uv` for dependency management.

Run tests from this folder with:

```sh
uv run pytest
```