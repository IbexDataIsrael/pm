from fastapi.testclient import TestClient
import pytest

from app.ai import MissingOpenRouterApiKey, OpenRouterRequestError
from app.database import DEFAULT_BOARD
from app.main import app


@pytest.fixture(autouse=True)
def temp_db(monkeypatch: pytest.MonkeyPatch, tmp_path):
    monkeypatch.setenv("PM_DB_PATH", str(tmp_path / "pm.sqlite3"))


client = TestClient(app)


def test_health_endpoint_returns_ok() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_index_serves_html_page() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "<!doctype html>" in response.text.lower()


def test_get_board_returns_default_board() -> None:
    response = client.get("/api/board")

    assert response.status_code == 200
    assert response.json() == {"board": DEFAULT_BOARD}


def test_put_board_persists_board_update() -> None:
    board = DEFAULT_BOARD.copy()
    board["columns"] = [column.copy() for column in DEFAULT_BOARD["columns"]]
    board["cards"] = {
        card_id: card.copy() for card_id, card in DEFAULT_BOARD["cards"].items()
    }
    board["columns"][0]["title"] = "Ideas"

    update_response = client.put("/api/board", json={"board": board})
    get_response = client.get("/api/board")

    assert update_response.status_code == 200
    assert get_response.json()["board"]["columns"][0]["title"] == "Ideas"


def test_put_board_rejects_malformed_board() -> None:
    response = client.put("/api/board", json={"board": {"columns": [], "cards": []}})

    assert response.status_code == 400


def test_ai_test_endpoint_returns_openrouter_reply(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.main.call_openrouter", lambda prompt: f"answer: {prompt}")

    response = client.post("/api/ai/test", json={"prompt": "2+2"})

    assert response.status_code == 200
    assert response.json()["reply"] == "answer: 2+2"
    assert response.json()["model"] == "openai/gpt-oss-120b"


def test_ai_test_endpoint_defaults_to_connectivity_prompt(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_prompt = {}

    def fake_call_openrouter(prompt: str) -> str:
        captured_prompt["prompt"] = prompt
        return "4"

    monkeypatch.setattr("app.main.call_openrouter", fake_call_openrouter)

    response = client.post("/api/ai/test", json={})

    assert response.status_code == 200
    assert captured_prompt["prompt"] == "2+2"


def test_ai_test_endpoint_reports_missing_api_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_call_openrouter(prompt: str) -> str:
        raise MissingOpenRouterApiKey("OPENROUTER_API_KEY is not configured.")

    monkeypatch.setattr("app.main.call_openrouter", fake_call_openrouter)

    response = client.post("/api/ai/test", json={"prompt": "2+2"})

    assert response.status_code == 503
    assert response.json()["detail"] == "OPENROUTER_API_KEY is not configured."


def test_ai_test_endpoint_reports_openrouter_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_call_openrouter(prompt: str) -> str:
        raise OpenRouterRequestError("OpenRouter request failed.")

    monkeypatch.setattr("app.main.call_openrouter", fake_call_openrouter)

    response = client.post("/api/ai/test", json={"prompt": "2+2"})

    assert response.status_code == 502
    assert response.json()["detail"] == "OpenRouter request failed."
