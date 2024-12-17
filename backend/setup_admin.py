import asyncio
import psycopg
from app.database.database import settings
from app.utils.auth import get_password_hash

async def make_admin():
    async with await psycopg.AsyncConnection.connect(settings.database_url) as conn:
        async with conn.cursor() as cur:
            # Check if admin exists
            await cur.execute('SELECT id FROM users WHERE id = %s', ('admin1',))
            if not await cur.fetchone():
                # Create admin user if doesn't exist
                hashed_password = get_password_hash('admin123')
                await cur.execute(
                    'INSERT INTO users (id, email, hashed_password, is_admin) VALUES (%s, %s, %s, %s)',
                    ('admin1', 'admin@example.com', hashed_password, True)
                )
            else:
                # Update existing user to be admin
                await cur.execute('UPDATE users SET is_admin = true WHERE id = %s', ('admin1',))

            await conn.commit()
            print("Admin user created/updated successfully")

if __name__ == "__main__":
    asyncio.run(make_admin())
