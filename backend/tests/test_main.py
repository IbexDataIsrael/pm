from fastapi.testclient import TestClient
import pytest

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
