from app.database.database import get_connection, init_db
import asyncio
import logging

async def reset_database():
    print("Dropping existing tables...")
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                DROP TABLE IF EXISTS todo_tags CASCADE;
                DROP TABLE IF EXISTS todos CASCADE;
                DROP TABLE IF EXISTS tags CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
            """)

    print("Initializing database with new schema...")
    await init_db()
    print("Database reset complete")

if __name__ == "__main__":
    asyncio.run(reset_database())
