"""
database.py  –  Lightweight SQLite persistence layer
"""

import sqlite3
import threading
from pathlib import Path

DB_PATH = Path(__file__).parent / "GalaxyBot.db"
_local = threading.local()


def get_conn() -> sqlite3.Connection:
    if not hasattr(_local, "conn"):
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
    return _local.conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS chat_settings (
            chat_id     INTEGER PRIMARY KEY,
            language    TEXT    DEFAULT 'en',
            warn_limit  INTEGER DEFAULT 3,
            warn_mode   TEXT    DEFAULT 'ban',
            welcome_msg TEXT    DEFAULT '',
            goodbye_msg TEXT    DEFAULT '',
            clean_welcome INTEGER DEFAULT 0,
            welcome_mute  INTEGER DEFAULT 0,
            rules       TEXT    DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS user_warns (
            chat_id INTEGER,
            user_id INTEGER,
            count   INTEGER DEFAULT 0,
            PRIMARY KEY (chat_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS notes (
            chat_id    INTEGER,
            name       TEXT,
            content    TEXT,
            PRIMARY KEY (chat_id, name)
        );

        CREATE TABLE IF NOT EXISTS filters (
            chat_id  INTEGER,
            keyword  TEXT,
            response TEXT,
            PRIMARY KEY (chat_id, keyword)
        );

        CREATE TABLE IF NOT EXISTS blacklist (
            chat_id INTEGER,
            word    TEXT,
            PRIMARY KEY (chat_id, word)
        );

        CREATE TABLE IF NOT EXISTS blacklist_mode (
            chat_id INTEGER PRIMARY KEY,
            mode    TEXT DEFAULT 'delete'
        );
    """)
    conn.commit()


# ── chat settings ──────────────────────────────────────────────────

def get_chat_settings(chat_id: int) -> dict:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM chat_settings WHERE chat_id=?", (chat_id,)
    ).fetchone()
    if row:
        return dict(row)
    # Insert defaults
    conn.execute(
        "INSERT OR IGNORE INTO chat_settings (chat_id) VALUES (?)", (chat_id,)
    )
    conn.commit()
    return get_chat_settings(chat_id)


def update_chat_setting(chat_id: int, key: str, value):
    conn = get_conn()
    conn.execute(
        f"INSERT INTO chat_settings (chat_id, {key}) VALUES (?, ?) "
        f"ON CONFLICT(chat_id) DO UPDATE SET {key}=excluded.{key}",
        (chat_id, value)
    )
    conn.commit()


# ── warns ──────────────────────────────────────────────────────────

def add_warn(chat_id: int, user_id: int) -> int:
    conn = get_conn()
    conn.execute(
        "INSERT INTO user_warns (chat_id, user_id, count) VALUES (?, ?, 1) "
        "ON CONFLICT(chat_id, user_id) DO UPDATE SET count=count+1",
        (chat_id, user_id)
    )
    conn.commit()
    row = conn.execute(
        "SELECT count FROM user_warns WHERE chat_id=? AND user_id=?",
        (chat_id, user_id)
    ).fetchone()
    return row["count"]


def get_warns(chat_id: int, user_id: int) -> int:
    conn = get_conn()
    row = conn.execute(
        "SELECT count FROM user_warns WHERE chat_id=? AND user_id=?",
        (chat_id, user_id)
    ).fetchone()
    return row["count"] if row else 0


def reset_warns(chat_id: int, user_id: int):
    conn = get_conn()
    conn.execute(
        "UPDATE user_warns SET count=0 WHERE chat_id=? AND user_id=?",
        (chat_id, user_id)
    )
    conn.commit()


def remove_one_warn(chat_id: int, user_id: int) -> int:
    conn = get_conn()
    conn.execute(
        "UPDATE user_warns SET count=MAX(0, count-1) WHERE chat_id=? AND user_id=?",
        (chat_id, user_id)
    )
    conn.commit()
    return get_warns(chat_id, user_id)


# ── notes ──────────────────────────────────────────────────────────

def save_note(chat_id: int, name: str, content: str):
    conn = get_conn()
    conn.execute(
        "INSERT INTO notes (chat_id, name, content) VALUES (?, ?, ?) "
        "ON CONFLICT(chat_id, name) DO UPDATE SET content=excluded.content",
        (chat_id, name.lower(), content)
    )
    conn.commit()


def get_note(chat_id: int, name: str) -> str | None:
    conn = get_conn()
    row = conn.execute(
        "SELECT content FROM notes WHERE chat_id=? AND name=?",
        (chat_id, name.lower())
    ).fetchone()
    return row["content"] if row else None


def list_notes(chat_id: int) -> list[str]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT name FROM notes WHERE chat_id=? ORDER BY name", (chat_id,)
    ).fetchall()
    return [r["name"] for r in rows]


def delete_note(chat_id: int, name: str):
    conn = get_conn()
    conn.execute("DELETE FROM notes WHERE chat_id=? AND name=?", (chat_id, name.lower()))
    conn.commit()


def delete_all_notes(chat_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM notes WHERE chat_id=?", (chat_id,))
    conn.commit()


# ── filters ────────────────────────────────────────────────────────

def add_filter(chat_id: int, keyword: str, response: str):
    conn = get_conn()
    conn.execute(
        "INSERT INTO filters (chat_id, keyword, response) VALUES (?, ?, ?) "
        "ON CONFLICT(chat_id, keyword) DO UPDATE SET response=excluded.response",
        (chat_id, keyword.lower(), response)
    )
    conn.commit()


def get_filters(chat_id: int) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT keyword, response FROM filters WHERE chat_id=? ORDER BY keyword",
        (chat_id,)
    ).fetchall()
    return [dict(r) for r in rows]


def remove_filter(chat_id: int, keyword: str):
    conn = get_conn()
    conn.execute("DELETE FROM filters WHERE chat_id=? AND keyword=?",
                 (chat_id, keyword.lower()))
    conn.commit()


def remove_all_filters(chat_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM filters WHERE chat_id=?", (chat_id,))
    conn.commit()


# ── blacklist ──────────────────────────────────────────────────────

def add_blacklist_word(chat_id: int, word: str):
    conn = get_conn()
    conn.execute(
        "INSERT OR IGNORE INTO blacklist (chat_id, word) VALUES (?, ?)",
        (chat_id, word.lower())
    )
    conn.commit()


def get_blacklist(chat_id: int) -> list[str]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT word FROM blacklist WHERE chat_id=? ORDER BY word", (chat_id,)
    ).fetchall()
    return [r["word"] for r in rows]


def remove_blacklist_word(chat_id: int, word: str):
    conn = get_conn()
    conn.execute("DELETE FROM blacklist WHERE chat_id=? AND word=?",
                 (chat_id, word.lower()))
    conn.commit()


def get_blacklist_mode(chat_id: int) -> str:
    conn = get_conn()
    row = conn.execute(
        "SELECT mode FROM blacklist_mode WHERE chat_id=?", (chat_id,)
    ).fetchone()
    return row["mode"] if row else "delete"


def set_blacklist_mode(chat_id: int, mode: str):
    conn = get_conn()
    conn.execute(
        "INSERT INTO blacklist_mode (chat_id, mode) VALUES (?, ?) "
        "ON CONFLICT(chat_id) DO UPDATE SET mode=excluded.mode",
        (chat_id, mode)
    )
    conn.commit()
