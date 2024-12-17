from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.database.database import settings, get_connection
import bcrypt
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT configuration
SECRET_KEY = "devin-secret-key-for-jwt-tokens"  # Using a consistent key for development
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
RESET_TOKEN_EXPIRE_MINUTES = 15

# Use bcrypt directly instead of passlib for password hashing
def get_password_hash(password: str) -> str:
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode(), salt)
        return hashed.decode()
    except Exception as e:
        logger.error(f"Password hashing error: {str(e)}")
        raise

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        logger.info(f"Starting password verification")
        logger.info(f"Input password length: {len(plain_password)}")
        logger.info(f"Stored hash length: {len(hashed_password)}")

        # Ensure the hash is in the correct format
        if not hashed_password.startswith('$2b$'):
            logger.error("Invalid hash format - doesn't start with $2b$")
            return False

        result = bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
        logger.info(f"Password verification result: {result}")
        return result
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        logger.exception("Full traceback:")
        return False

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Email configuration
mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from if settings.mail_from else settings.mail_username,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_STARTTLS=settings.mail_tls,
    MAIL_SSL_TLS=settings.mail_ssl,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

fastmail = FastMail(mail_config)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception

async def get_current_admin_user(current_user: str = Depends(get_current_user)):
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT is_admin FROM users WHERE id = ?",
                (current_user,)
            )
            result = await cur.fetchone()
            if not result or not result[0]:
                raise HTTPException(
                    status_code=403,
                    detail="管理者権限が必要です。"
                )
            return current_user

def create_password_reset_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": user_id,
        "exp": expire,
        "type": "reset"
    }
    return jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

def verify_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid reset token")

async def send_reset_email(email: str, user_id: str, reset_token: str):
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"

    try:
        message = MessageSchema(
            subject="パスワードリセットのご案内",
            recipients=[email],
            template_body={
                "reset_url": reset_url,
                "expires_in": RESET_TOKEN_EXPIRE_MINUTES
            },
            subtype="html"
        )

        # Development mode: Print email content instead of sending
        print(f"\n=== Development Mode: Email Content ===")
        print(f"To: {email}")
        print(f"Subject: パスワードリセットのご案内")
        print(f"Reset URL: {reset_url}")
        print(f"Token expires in: {RESET_TOKEN_EXPIRE_MINUTES} minutes")
        print("=====================================\n")

        # In development mode, return both the message and the reset URL for testing
        return {
            "message": "パスワードリセット用のメールを送信しました。メールをご確認ください。",
            "reset_url": reset_url  # Only included in development mode
        }
    except Exception as e:
        print(f"Email sending error (development mode): {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="パスワードリセットメールの送信に失敗しました。"
        )
