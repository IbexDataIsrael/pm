import json

import pytest
from fastapi.testclient import TestClient

from app.ai_chat import (
    build_ai_messages,
    parse_structured_ai_response,
)
from app.database import DEFAULT_BOARD
from app.main import app


@pytest.fixture(autouse=True)
def temp_db(monkeypatch: pytest.MonkeyPatch, tmp_path):
    monkeypatch.setenv("PM_DB_PATH", str(tmp_path / "pm.sqlite3"))


client = TestClient(app)


def changed_default_board() -> dict:
    board = DEFAULT_BOARD.copy()
    board["columns"] = [column.copy() for column in DEFAULT_BOARD["columns"]]
    board["cards"] = {
        card_id: card.copy() for card_id, card in DEFAULT_BOARD["cards"].items()
    }
    board["columns"][0]["title"] = "AI Ideas"
    return board


def test_build_ai_messages_includes_board_user_message_and_history() -> None:
    messages = build_ai_messages(
        DEFAULT_BOARD,
        "Move the analytics card",
        [{"role": "assistant", "content": "What should change?"}],
    )

    assert messages[0]["role"] == "system"
    assert '"columns"' in messages[0]["content"]
    assert messages[1] == {"role": "assistant", "content": "What should change?"}
    assert messages[2] == {"role": "user", "content": "Move the analytics card"}


def test_parse_structured_ai_response_ignores_invalid_board() -> None:
    response = json.dumps({"message": "I tried.", "board": {"columns": [], "cards": []}})

    message, board = parse_structured_ai_response(response)

    assert message == "I tried."
    assert board is None


def test_parse_structured_ai_response_accepts_fenced_json() -> None:
    message, board = parse_structured_ai_response(
        '```json\n{"message": "Done.", "board": null}\n```'
    )

    assert message == "Done."
    assert board is None


def test_parse_structured_ai_response_falls_back_to_plain_text() -> None:
    message, board = parse_structured_ai_response("Here is a summary of your board.")

    assert message == "Here is a summary of your board."
    assert board is None


def test_parse_structured_ai_response_falls_back_from_malformed_wrapped_json() -> None:
    message, board = parse_structured_ai_response('Sure: {"message": "Almost",')

    assert message == 'Sure: {"message": "Almost",'
    assert board is None


def test_parse_structured_ai_response_falls_back_from_non_object_json() -> None:
    message, board = parse_structured_ai_response('["not", "the", "schema"]')

    assert message == '["not", "the", "schema"]'
    assert board is None


def test_parse_structured_ai_response_accepts_reply_key() -> None:
    message, board = parse_structured_ai_response(
        '{"reply": "Here is the board summary.", "board": null}'
    )

    assert message == "Here is the board summary."
    assert board is None


def test_parse_structured_ai_response_cleans_invalid_unicode() -> None:
    message, board = parse_structured_ai_response('{"message": "Bad \\udf2d text", "board": null}')

    assert message == "Bad ? text"
    assert board is None


def test_ai_chat_endpoint_returns_text_without_board_change(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.ai_chat.call_openrouter_messages",
        lambda messages, json_response: json.dumps(
            {"message": "No board changes needed.", "board": None}
        ),
    )

    response = client.post("/api/ai/chat", json={"message": "What is on my board?"})

    assert response.status_code == 200
    assert response.json() == {
        "message": "No board changes needed.",
        "boardChanged": False,
    }


def test_ai_chat_endpoint_persists_valid_board_update(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    board = changed_default_board()
    monkeypatch.setattr(
        "app.ai_chat.call_openrouter_messages",
        lambda messages, json_response: json.dumps(
            {"message": "Renamed the first column.", "board": board}
        ),
    )

    response = client.post("/api/ai/chat", json={"message": "Rename backlog"})
    board_response = client.get("/api/board")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Renamed the first column.",
        "boardChanged": True,
    }
    assert board_response.json()["board"]["columns"][0]["title"] == "AI Ideas"


def test_ai_chat_endpoint_ignores_unchanged_board(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.ai_chat.call_openrouter_messages",
        lambda messages, json_response: json.dumps(
            {"message": "Here is your board.", "board": DEFAULT_BOARD}
        ),
    )

    response = client.post("/api/ai/chat", json={"message": "What is on my board?"})

    assert response.status_code == 200
    assert response.json() == {
        "message": "Here is your board.",
        "boardChanged": False,
    }
