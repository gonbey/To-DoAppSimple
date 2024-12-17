import pytest
from app.utils.auth import get_password_hash, verify_password

@pytest.mark.asyncio
async def test_password_verification():
    password = "test123"
    hashed = get_password_hash(password)
    print(f"Original password: {password}")
    print(f"Hashed password: {hashed}")
    assert verify_password(password, hashed) == True
    assert verify_password("wrongpass", hashed) == False

if __name__ == "__main__":
    pytest.main([__file__])
