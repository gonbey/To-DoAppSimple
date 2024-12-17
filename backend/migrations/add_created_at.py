import asyncio
import psycopg
from app.database.database import settings

async def add_created_at_column():
    async with await psycopg.AsyncConnection.connect(settings.database_url) as conn:
        async with conn.cursor() as cur:
            # Add created_at column with default value
            await cur.execute("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE
                DEFAULT CURRENT_TIMESTAMP;
            """)
            await conn.commit()
            print("Successfully added created_at column to users table")

if __name__ == "__main__":
    asyncio.run(add_created_at_column())
