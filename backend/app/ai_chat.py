import json
from dataclasses import dataclass
from typing import Any

from app.ai import call_openrouter_messages
from app.database import get_board, update_board, validate_board


MAX_HISTORY_MESSAGES = 10


class InvalidAiResponse(ValueError):
    pass


@dataclass(frozen=True)
class AiChatResult:
    message: str
    board_changed: bool


def run_ai_chat(
    user_message: str,
    history: list[dict[str, str]] | None = None,
) -> AiChatResult:
    board = get_board()
    response_text = call_openrouter_messages(
        build_ai_messages(board, user_message, history or []),
        json_response=True,
    )
    assistant_message, updated_board = parse_structured_ai_response(response_text)

    board_changed = updated_board is not None and updated_board != board
    if board_changed:
        update_board(updated_board)

    return AiChatResult(message=assistant_message, board_changed=board_changed)


def build_ai_messages(
    board: dict[str, Any],
    user_message: str,
    history: list[dict[str, str]],
) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You are the AI assistant for a local Kanban project management app. "
                "Return raw JSON only. Do not use Markdown, code fences, or extra text. "
                "Use this schema: "
                '{"message": "user-facing reply", "board": null or full updated board}. '
                "Only include a board object when the user asked for a board change. "
                "The board must keep the same shape: columns array, cards object, "
                "column cardIds, and card objects with id, title, and details. "
                f"Current board JSON: {json.dumps(board)}"
            ),
        },
        *normalize_history(history),
        {"role": "user", "content": user_message},
    ]


def normalize_history(history: list[dict[str, str]]) -> list[dict[str, str]]:
    normalized_messages: list[dict[str, str]] = []
    for item in history[-MAX_HISTORY_MESSAGES:]:
        role = item.get("role")
        content = item.get("content")
        if role in {"user", "assistant"} and isinstance(content, str) and content:
            normalized_messages.append({"role": role, "content": content})
    return normalized_messages


def parse_structured_ai_response(
    response_text: str,
) -> tuple[str, dict[str, Any] | None]:
    response_text = response_text.strip()
    if not response_text:
        raise InvalidAiResponse("AI response must include a message.")

    try:
        response = json.loads(response_text)
    except json.JSONDecodeError:
        extracted_json = extract_json_object(response_text)
        if extracted_json is None:
            return clean_ai_text(response_text), None
        try:
            response = json.loads(extracted_json)
        except json.JSONDecodeError:
            return clean_ai_text(response_text), None

    if not isinstance(response, dict):
        return clean_ai_text(response_text), None

    message = response.get("message")
    if not isinstance(message, str) or not message.strip():
        fallback_message = response.get("reply") or response.get("response")
        if isinstance(fallback_message, str) and fallback_message.strip():
            message = fallback_message
        else:
            return clean_ai_text(response_text), None
    message = clean_ai_text(message)

    board = response.get("board")
    if board is None:
        return message, None
    if not isinstance(board, dict):
        return message, None

    clean_board = clean_ai_value(board)
    if not isinstance(clean_board, dict):
        return message, None

    try:
        validate_board(clean_board)
    except ValueError:
        return message, None
    return message, clean_board


def extract_json_object(response_text: str) -> str | None:
    if not response_text:
        return None

    fenced_start = response_text.find("```")
    if fenced_start != -1:
        content_start = response_text.find("\n", fenced_start)
        fenced_end = response_text.find("```", content_start + 1)
        if content_start != -1 and fenced_end != -1:
            return response_text[content_start:fenced_end].strip()

    object_start = response_text.find("{")
    object_end = response_text.rfind("}")
    if object_start == -1 or object_end == -1 or object_end <= object_start:
        return None
    return response_text[object_start : object_end + 1]


def clean_ai_value(value: Any) -> Any:
    if isinstance(value, str):
        return clean_ai_text(value)
    if isinstance(value, list):
        return [clean_ai_value(item) for item in value]
    if isinstance(value, dict):
        return {key: clean_ai_value(item) for key, item in value.items()}
    return value


def clean_ai_text(value: str) -> str:
    return value.encode("utf-8", errors="replace").decode("utf-8")
