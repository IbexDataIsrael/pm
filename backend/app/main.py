from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse


STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title="Project Management MVP")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/{static_path:path}", include_in_schema=False)
def static_files(static_path: str = "") -> FileResponse:
    requested_path = static_path or "index.html"
    file_path = (STATIC_DIR / requested_path).resolve()

    if not file_path.is_relative_to(STATIC_DIR.resolve()) or not file_path.is_file():
        raise HTTPException(status_code=404)

    return FileResponse(file_path)
