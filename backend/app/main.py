from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.ai import (
    MissingOpenRouterApiKey,
    OPENROUTER_MODEL,
    OpenRouterRequestError,
    call_openrouter,
)
from app.ai_chat import InvalidAiResponse, run_ai_chat
from app.database import get_board, initialize_database, update_board


STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Project Management MVP", lifespan=lifespan)


class BoardRequest(BaseModel):
    board: dict[str, Any]


class AiTestRequest(BaseModel):
    prompt: str = "2+2"


class ChatMessage(BaseModel):
    role: str
    content: str


class AiChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


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


@app.post("/api/ai/test")
def test_ai_connectivity(payload: AiTestRequest) -> dict[str, str]:
    try:
        reply = call_openrouter(payload.prompt)
    except MissingOpenRouterApiKey as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except OpenRouterRequestError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return {"model": OPENROUTER_MODEL, "reply": reply}


@app.post("/api/ai/chat")
def chat_with_ai(payload: AiChatRequest) -> dict[str, Any]:
    try:
        result = run_ai_chat(
            payload.message,
            [message.model_dump() for message in payload.history],
        )
    except MissingOpenRouterApiKey as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except OpenRouterRequestError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except InvalidAiResponse as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return {"message": result.message, "boardChanged": result.board_changed}


@app.get("/{static_path:path}", include_in_schema=False)
def static_files(static_path: str = "") -> FileResponse:
    requested_path = static_path or "index.html"
    file_path = (STATIC_DIR / requested_path).resolve()

    if not file_path.is_relative_to(STATIC_DIR.resolve()) or not file_path.is_file():
        raise HTTPException(status_code=404)

    return FileResponse(file_path)
