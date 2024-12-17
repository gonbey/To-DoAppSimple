from typing import Union, AsyncContextManager
import aiosqlite
import logging
from pydantic_settings import BaseSettings
import asyncio
from contextlib import asynccontextmanager
import os

class Settings(BaseSettings):
    database_url: str = "sqlite://data/todo.db"  # Default file-based database path
    database_mode: str = "file"    # "memory" or "file"
    test_mode: bool = False  # Test mode flag

    # Email settings
    mail_username: str = "noreply@example.com"  # Default value for validation
    mail_password: str = "dummy_password"       # Default value for validation
    mail_from: str = ""
    mail_server: str = "smtp.gmail.com"
    mail_port: int = 587
    mail_tls: bool = True
    mail_ssl: bool = False

    class Config:
        env_file = ".env"

# Global settings instance that can be modified for testing
settings = Settings()

def get_db_uri() -> str:
    """Get the database URI based on current settings."""
    if settings.test_mode:
        # Use test database
        return os.path.join(os.getcwd(), "test.db")
    elif settings.database_mode == "memory":
        # Use in-memory database
        return ":memory:"
    else:
        # Use file-based database
        db_dir = os.path.join(os.getcwd(), "data")
        os.makedirs(db_dir, exist_ok=True)
        return os.path.join(db_dir, "todo.db")

@asynccontextmanager
async def get_connection() -> AsyncContextManager[aiosqlite.Connection]:
    """Get a database connection as an async context manager."""
    conn = None
    try:
        conn_str = get_db_uri()
        if settings.database_mode == "file":
            # Ensure directory exists for file-based database
            db_dir = os.path.dirname(conn_str)
            if db_dir:  # Only create directory if path is not just a filename
                os.makedirs(db_dir, exist_ok=True)
        conn = await aiosqlite.connect(conn_str)
        await conn.execute("PRAGMA foreign_keys = ON")
        yield conn
    finally:
        if conn:
            await conn.close()

async def init_db():
    retries = 3
    for attempt in range(retries):
        try:
            logging.info(f"Attempting database initialization (attempt {attempt + 1}/{retries})")
            async with get_connection() as conn:
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        email TEXT UNIQUE NOT NULL,
                        hashed_password TEXT NOT NULL,
                        is_admin INTEGER DEFAULT 0,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS tags (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT UNIQUE NOT NULL
                    )
                """)

                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS todos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                        title TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT '未完了',
                        deadline TEXT NOT NULL,
                        content TEXT NOT NULL,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        CHECK (status IN ('未完了', '進行中', '完了'))
                    )
                """)

                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS todo_tags (
                        todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
                        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                        PRIMARY KEY (todo_id, tag_id)
                    )
                """)

            logging.info("Database initialized successfully")
            return
        except Exception as e:
            logging.error(f"Database initialization failed: {str(e)}")
            if attempt == retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)
