import sqlite3

import pytest

from app.database import DEFAULT_BOARD, get_board, initialize_database, update_board


@pytest.fixture()
def temp_db(monkeypatch: pytest.MonkeyPatch, tmp_path):
    db_path = tmp_path / "pm.sqlite3"
    monkeypatch.setenv("PM_DB_PATH", str(db_path))
    return db_path


def test_initialize_database_creates_user_and_default_board(temp_db) -> None:
    initialize_database()

    assert temp_db.exists()
    with sqlite3.connect(temp_db) as connection:
        user_count = connection.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        board_count = connection.execute("SELECT COUNT(*) FROM boards").fetchone()[0]

    assert user_count == 1
    assert board_count == 1
    assert get_board() == DEFAULT_BOARD


def test_update_board_persists_changes(temp_db) -> None:
    board = get_board()
    board["columns"][0]["title"] = "Ideas"

    update_board(board)

    assert get_board()["columns"][0]["title"] == "Ideas"


def test_update_board_rejects_missing_card_reference(temp_db) -> None:
    board = get_board()
    board["columns"][0]["cardIds"].append("missing-card")

    with pytest.raises(ValueError, match="existing cards"):
        update_board(board)
