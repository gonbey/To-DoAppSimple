import asyncio
import json
import httpx
import logging
import pytest
import os
from datetime import datetime, timedelta
from typing import Dict, Any
from app.utils.auth import get_password_hash
from app.database.database import get_connection, init_db, settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@pytest.fixture(autouse=True)
async def setup_test_database():
    """Setup a fresh test database for each test."""
    # Set test mode and database settings
    settings.test_mode = True
    settings.database_mode = "file"  # Ensure we're using file mode for tests
    logger.info("Setting up test database...")

    # Get the test database path
    test_db = os.path.join(os.getcwd(), "test.db")
    logger.info(f"Using test database at: {test_db}")

    # Remove existing test database if it exists
    if os.path.exists(test_db):
        os.remove(test_db)
        logger.info("Removed existing test database")

    # Initialize fresh database
    await init_db()
    logger.info("Database initialized")

    async with get_connection() as conn:
        # Create admin user
        hashed_password = get_password_hash("admin123")
        logger.info(f"Creating admin user with hashed password: {hashed_password}")

        # Verify database connection
        cursor = await conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        tables = await cursor.fetchall()
        logger.info(f"Available tables: {tables}")

        # Create admin user
        await conn.execute(
            """
            INSERT INTO users (id, email, hashed_password, is_admin)
            VALUES (?, ?, ?, ?)
            """,
            ("admin1", "admin@example.com", hashed_password, 1)
        )
        await conn.commit()

        # Verify admin user creation
        cursor = await conn.execute("SELECT id, email, is_admin FROM users WHERE id = ?", ("admin1",))
        admin_user = await cursor.fetchone()
        logger.info(f"Admin user verification: {admin_user}")

    yield  # Run the test

    # Cleanup after test
    settings.test_mode = False  # Reset test mode
    settings.database_mode = "file"  # Reset database mode
    try:
        os.remove(test_db)
        logger.info("Test database cleaned up")
    except OSError:
        pass

@pytest.mark.asyncio
async def test_endpoints():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Test user registration
        logger.info("\nTesting user registration...")
        register_data = {
            "id": "testuser",
            "email": "test@example.com",
            "password": "test123"
        }
        register_response = await client.post("/api/auth/register", json=register_data)
        logger.info(f"User registration status: {register_response.status_code}")
        logger.info(f"Registration response: {register_response.text}")

        # Test login endpoints
        logger.info("\nTesting login endpoints...")

        # Admin login
        admin_login_data = {
            "id": "admin1",
            "password": "admin123"
        }
        admin_login = await client.post("/api/auth/login", json=admin_login_data)
        logger.info(f"Admin login status: {admin_login.status_code}")
        logger.info(f"Admin login response: {admin_login.text}")

        assert admin_login.status_code == 200, f"Admin login failed with response: {admin_login.text}"
        admin_login_json = admin_login.json()
        assert "access_token" in admin_login_json, f"No access token in response: {admin_login_json}"
        admin_token = admin_login_json["access_token"]

        # User login
        user_login = await client.post("/api/auth/login", json=register_data)
        logger.info(f"User login status: {user_login.status_code}")
        user_token = user_login.json()["access_token"]

        # Test password reset
        logger.info("\nTesting password reset...")
        # Request reset
        reset_request = {
            "id": "testuser"
        }
        reset_response = await client.post("/api/auth/request-reset", json=reset_request)
        logger.info(f"Password reset request status: {reset_response.status_code}")

        # Confirm reset
        confirm_reset = {
            "id": "testuser",
            "new_password": "newpass123"
        }
        confirm_response = await client.post("/api/auth/reset-password", json=confirm_reset)
        logger.info(f"Password reset confirmation status: {confirm_response.status_code}")

        # Test login with new password
        new_login = await client.post("/api/auth/login", json={
            "id": "testuser",
            "password": "newpass123"
        })
        logger.info(f"Login with new password status: {new_login.status_code}")

        # Test admin endpoints
        logger.info("\nTesting admin endpoints...")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # List users
        users_response = await client.get("/api/admin/users", headers=admin_headers)
        logger.info(f"List users status: {users_response.status_code}")

        # Update user
        update_user_data = {
            "email": "updated@example.com"
        }
        update_user_response = await client.put(
            "/api/admin/users/testuser",
            json=update_user_data,
            headers=admin_headers
        )
        logger.info(f"Update user status: {update_user_response.status_code}")

        # Test Todo CRUD operations
        logger.info("\nTesting Todo CRUD operations...")
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # Create Todo
        todo_data = {
            "title": "Test Todo",
            "status": "未完了",
            "deadline": (datetime.now() + timedelta(days=1)).isoformat(),
            "content": "Test content",
            "tags": ["work", "important"]
        }
        create_response = await client.post("/api/todos", json=todo_data, headers=user_headers)
        logger.info(f"Create Todo status: {create_response.status_code}")

        if create_response.status_code == 200:
            todo_id = create_response.json()["id"]

            # Get Todo
            get_response = await client.get("/api/todos", headers=user_headers)
            logger.info(f"Get Todos status: {get_response.status_code}")

            # Update Todo
            update_data = {
                "title": "Updated Todo",
                "status": "進行中",
                "deadline": (datetime.now() + timedelta(days=2)).isoformat(),
                "content": "Updated content",
                "tags": ["work", "urgent"]
            }
            update_response = await client.put(
                f"/api/todos/{todo_id}",
                json=update_data,
                headers=user_headers
            )
            logger.info(f"Update Todo status: {update_response.status_code}")

            # Delete Todo
            delete_response = await client.delete(
                f"/api/todos/{todo_id}",
                headers=user_headers
            )
            logger.info(f"Delete Todo status: {delete_response.status_code}")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
