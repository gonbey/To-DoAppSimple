import asyncio
import psycopg
from app.database.database import settings

async def check_user():
    async with await psycopg.AsyncConnection.connect(settings.database_url) as conn:
        async with conn.cursor() as cur:
            await cur.execute('SELECT id, email FROM users')
            users = await cur.fetchall()
            print('Users in database:')
            for user in users:
                print(f'ID: {user[0]}, Email: {user[1]}')

if __name__ == "__main__":
    asyncio.run(check_user())
