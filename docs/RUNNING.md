# Running the App Locally

This project runs locally in Docker.

## Windows

Start:

```powershell
.\scripts\start-windows.ps1
```

Stop:

```powershell
.\scripts\stop-windows.ps1
```

## macOS

Start:

```sh
./scripts/start-macos.sh
```

Stop:

```sh
./scripts/stop-macos.sh
```

## Linux

Start:

```sh
./scripts/start-linux.sh
```

Stop:

```sh
./scripts/stop-linux.sh
```

## Smoke Checks

After starting the container:

- Open `http://localhost:8000/` to see the Kanban board.
- Open `http://localhost:8000/api/health` to confirm the API returns `{"status":"ok"}`.
- AI chat requires `OPENROUTER_API_KEY` in the project root `.env`. The start scripts pass that file to Docker at runtime.

Backend tests can be run from `backend/` with:

```sh
uv run pytest
```

## Known Limitations

- Board state persists in SQLite under `backend/data/`, which the start scripts mount
  into the container so changes survive restarts and rebuilds.
- Board saves are last-write-wins. The whole board is written on every change, so a
  manual edit and an AI edit that overlap will overwrite each other. The MVP does not
  include conflict handling, offline sync, or retries.
