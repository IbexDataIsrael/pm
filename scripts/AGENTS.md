# Scripts

This folder contains Docker start and stop scripts for local development.

- `start-windows.ps1` and `stop-windows.ps1` are for Windows PowerShell.
- `start-macos.sh` and `stop-macos.sh` are for macOS.
- `start-linux.sh` and `stop-linux.sh` are for Linux.

All scripts use the Docker image name `pm-mvp` and container name `pm-mvp`.
Start scripts pass the project root `.env` file to Docker when it exists so server-side settings like `OPENROUTER_API_KEY` are available inside the container.