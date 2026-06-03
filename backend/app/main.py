from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.database import get_board, initialize_database, update_board


STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Project Management MVP", lifespan=lifespan)


class BoardRequest(BaseModel):
    board: dict[str, Any]


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/board")
def read_board() -> dict[str, Any]:
    return {"board": get_board()}


@app.put("/api/board")
def write_board(payload: BoardRequest) -> dict[str, Any]:
    try:
        board = update_board(payload.board)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"board": board}


@app.get("/{static_path:path}", include_in_schema=False)
def static_files(static_path: str = "") -> FileResponse:
    requested_path = static_path or "index.html"
    file_path = (STATIC_DIR / requested_path).resolve()

    if not file_path.is_relative_to(STATIC_DIR.resolve()) or not file_path.is_file():
        raise HTTPException(status_code=404)

    return FileResponse(file_path)
