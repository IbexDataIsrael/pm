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

Backend tests can be run from `backend/` with:

```sh
uv run pytest
```
