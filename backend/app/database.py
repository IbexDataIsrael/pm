import json
import os
import sqlite3
from pathlib import Path
from typing import Any


MVP_USERNAME = "user"
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "pm.sqlite3"

DEFAULT_BOARD: dict[str, Any] = {
    "columns": [
        {"id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"]},
        {"id": "col-discovery", "title": "Discovery", "cardIds": ["card-3"]},
        {"id": "col-progress", "title": "In Progress", "cardIds": ["card-4", "card-5"]},
        {"id": "col-review", "title": "Review", "cardIds": ["card-6"]},
        {"id": "col-done", "title": "Done", "cardIds": ["card-7", "card-8"]},
    ],
    "cards": {
        "card-1": {
            "id": "card-1",
            "title": "Align roadmap themes",
            "details": "Draft quarterly themes with impact statements and metrics.",
        },
        "card-2": {
            "id": "card-2",
            "title": "Gather customer signals",
            "details": "Review support tags, sales notes, and churn feedback.",
        },
        "card-3": {
            "id": "card-3",
            "title": "Prototype analytics view",
            "details": "Sketch initial dashboard layout and key drill-downs.",
        },
        "card-4": {
            "id": "card-4",
            "title": "Refine status language",
            "details": "Standardize column labels and tone across the board.",
        },
        "card-5": {
            "id": "card-5",
            "title": "Design card layout",
            "details": "Add hierarchy and spacing for scanning dense lists.",
        },
        "card-6": {
            "id": "card-6",
            "title": "QA micro-interactions",
            "details": "Verify hover, focus, and loading states.",
        },
        "card-7": {
            "id": "card-7",
            "title": "Ship marketing page",
            "details": "Final copy approved and asset pack delivered.",
        },
        "card-8": {
            "id": "card-8",
            "title": "Close onboarding sprint",
            "details": "Document release notes and share internally.",
        },
    },
}


def get_db_path() -> Path:
    configured_path = os.environ.get("PM_DB_PATH")
    return Path(configured_path) if configured_path else DEFAULT_DB_PATH


def connect() -> sqlite3.Connection:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    with connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password_hash TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS boards (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL UNIQUE,
              board_json TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards (user_id);
            """
        )
        user_id = ensure_user(connection, MVP_USERNAME)
        ensure_board(connection, user_id)


def ensure_user(connection: sqlite3.Connection, username: str) -> int:
    connection.execute(
        "INSERT OR IGNORE INTO users (username) VALUES (?)",
        (username,),
    )
    row = connection.execute(
        "SELECT id FROM users WHERE username = ?",
        (username,),
    ).fetchone()
    if row is None:
        raise RuntimeError("Unable to create MVP user.")
    return int(row["id"])


def ensure_board(connection: sqlite3.Connection, user_id: int) -> None:
    connection.execute(
        "INSERT OR IGNORE INTO boards (user_id, board_json) VALUES (?, ?)",
        (user_id, json.dumps(DEFAULT_BOARD)),
    )


def get_board(username: str = MVP_USERNAME) -> dict[str, Any]:
    initialize_database()
    with connect() as connection:
        row = connection.execute(
            """
            SELECT boards.board_json
            FROM boards
            JOIN users ON users.id = boards.user_id
            WHERE users.username = ?
            """,
            (username,),
        ).fetchone()
    if row is None:
        raise RuntimeError("Board was not initialized.")
    return json.loads(row["board_json"])


def update_board(board: dict[str, Any], username: str = MVP_USERNAME) -> dict[str, Any]:
    validate_board(board)
    initialize_database()
    with connect() as connection:
        user_id = ensure_user(connection, username)
        connection.execute(
            """
            UPDATE boards
            SET board_json = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            """,
            (json.dumps(board), user_id),
        )
    return board


def validate_board(board: dict[str, Any]) -> None:
    if not isinstance(board, dict):
        raise ValueError("Board must be an object.")

    columns = board.get("columns")
    cards = board.get("cards")
    if not isinstance(columns, list) or not isinstance(cards, dict):
        raise ValueError("Board must include columns array and cards object.")

    seen_card_ids: set[str] = set()
    for column in columns:
        if not isinstance(column, dict):
            raise ValueError("Each column must be an object.")
        if not isinstance(column.get("id"), str):
            raise ValueError("Each column must include a string id.")
        if not isinstance(column.get("title"), str):
            raise ValueError("Each column must include a string title.")
        card_ids = column.get("cardIds")
        if not isinstance(card_ids, list):
            raise ValueError("Each column must include cardIds array.")
        for card_id in card_ids:
            if not isinstance(card_id, str):
                raise ValueError("Card ids must be strings.")
            if card_id in seen_card_ids:
                raise ValueError("Card ids cannot appear in multiple columns.")
            if card_id not in cards:
                raise ValueError("Column cardIds must reference existing cards.")
            seen_card_ids.add(card_id)

    for card_id, card in cards.items():
        if not isinstance(card_id, str) or not isinstance(card, dict):
            raise ValueError("Cards must be keyed objects.")
        if card.get("id") != card_id:
            raise ValueError("Card id must match its key.")
        if not isinstance(card.get("title"), str):
            raise ValueError("Each card must include a string title.")
        if not isinstance(card.get("details"), str):
            raise ValueError("Each card must include string details.")
