from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database.database import get_connection, init_db, settings
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from app.schemas.password_reset import PasswordResetRequest, PasswordResetResponse, PasswordResetConfirm
from app.schemas.admin import UserUpdate, UserListResponse
from app.utils.auth import (
    get_password_hash, verify_password, create_access_token, get_current_user,
    create_password_reset_token, verify_reset_token, send_reset_email,
    get_current_admin_user
)
from typing import List, Optional
import logging
import asyncio
from pydantic import EmailStr, parse_obj_as

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS configuration for development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://todo-task-app-wgmga1jp.devinapps.com"  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization", "Origin"],
    expose_headers=["Content-Type"]
)

@app.on_event("startup")
async def startup():
    retries = 3
    for attempt in range(retries):
        try:
            logging.info(f"Attempting database initialization (attempt {attempt + 1}/{retries})")
            await init_db()
            logging.info("Database initialization complete")
            return
        except Exception as e:
            logging.error(f"Database initialization failed: {str(e)}")
            if attempt == retries - 1:
                logging.error("All database initialization attempts failed")
                raise Exception("Failed to initialize database after 3 attempts")
            await asyncio.sleep(2 ** attempt)  # Exponential backoff

@app.post("/api/auth/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    # Validate input data
    if not user.id or not user.email or not user.password:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": {
                    "message": "入力データが不正です。",
                    "error": "ユーザーID、メールアドレス、パスワードは必須です。"
                }
            }
        )

    try:
        async with get_connection() as conn:
            # Check if user already exists - using parameterized query
            query = "SELECT id FROM users WHERE id = ? OR email = ?"
            cursor = await conn.execute(query, (user.id, user.email))
            existing_user = await cursor.fetchone()

            if existing_user:
                logger.warning(f"Registration attempt with existing user ID or email: {user.id}")
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "detail": {
                            "message": "ユーザー登録に失敗しました。",
                            "error": "このユーザーIDまたはメールアドレスは既に使用されています。"
                        }
                    }
                )

            try:
                # Hash password and insert new user
                hashed_password = get_password_hash(user.password)
                insert_query = """
                    INSERT INTO users (id, email, hashed_password, is_admin, created_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                """
                await conn.execute(insert_query, (user.id, user.email, hashed_password, 0))
                await conn.commit()

                # Get and return the inserted user
                select_query = "SELECT id, email, is_admin, created_at FROM users WHERE id = ?"
                cursor = await conn.execute(select_query, (user.id,))
                result = await cursor.fetchone()

                if not result:
                    raise Exception("User was not created successfully")

                return UserResponse(
                    id=result[0],
                    email=result[1],
                    is_admin=bool(result[2]),
                    created_at=result[3]
                )
            except Exception as db_error:
                logger.error(f"Database error during user creation: {str(db_error)}")
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "detail": {
                            "message": "ユーザー登録に失敗しました。",
                            "error": "データベースエラーが発生しました。"
                        }
                    }
                )
    except Exception as e:
        logger.error(f"Unexpected error in register_user: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": {
                    "message": "ユーザー登録に失敗しました。",
                    "error": "予期せぬエラーが発生しました。"
                }
            }
        )

@app.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    try:
        logger.info(f"Login attempt for email: {user_credentials.email}")
        async with get_connection() as conn:
            cursor = await conn.execute(
                "SELECT id, email, hashed_password, is_admin FROM users WHERE email = ?",
                (user_credentials.email,)
            )
            result = await cursor.fetchone()

            if not result:
                logger.warning(f"User with email {user_credentials.email} not found")
                raise HTTPException(
                    status_code=401,
                    detail="Incorrect email or password"
                )

            stored_password = result[2]
            logger.info(f"Retrieved stored hash for user with email {user_credentials.email}")
            logger.info(f"Stored hash: {stored_password}")
            logger.info(f"Input password: {user_credentials.password}")

            if not verify_password(user_credentials.password, stored_password):
                logger.warning(f"Password verification failed for email {user_credentials.email}")
                raise HTTPException(
                    status_code=401,
                    detail="Incorrect email or password"
                )

            logger.info(f"Password verified successfully for {user_credentials.email}")
            access_token = create_access_token(
                data={"sub": result[0], "email": result[1], "is_admin": bool(result[3])},
                expires_delta=timedelta(minutes=30)
            )

            return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(
            status_code=500,
            detail={"message": "ログインに失敗しました。", "error": "予期せぬエラーが発生しました。"}
        )

@app.get("/api/auth/verify")
async def verify_token(current_user: str = Depends(get_current_user)):
    return {"status": "ok", "user": current_user}

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/todos", response_model=TodoResponse)
async def create_todo(todo: TodoCreate, current_user: str = Depends(get_current_user)):
    try:
        async with await get_connection() as conn:
            async with conn.cursor() as cur:
                # Insert todo
                await cur.execute(
                    """
                    INSERT INTO todos (user_id, title, status, deadline, content)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (current_user, todo.title, todo.status, todo.deadline, todo.content)
                )
                await conn.commit()

                # Get the inserted todo's id
                await cur.execute("SELECT last_insert_rowid()")
                todo_id = await cur.fetchone()
                todo_id = todo_id[0]

                # Handle tags
                for tag_name in todo.tags:
                    try:
                        # Insert or get existing tag
                        await cur.execute(
                            "INSERT OR IGNORE INTO tags (name) VALUES (?)",
                            (tag_name,)
                        )
                        await conn.commit()

                        # Get tag id
                        await cur.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
                        tag_result = await cur.fetchone()
                        tag_id = tag_result[0]

                        # Link todo with tag
                        await cur.execute(
                            "INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)",
                            (todo_id, tag_id)
                        )
                        await conn.commit()
                    except Exception as e:
                        logger.error(f"Error handling tag {tag_name}: {str(e)}")
                        continue

                # Get the complete todo with all fields
                await cur.execute(
                    """
                    SELECT t.id, t.user_id, t.title, t.status, t.deadline, t.content,
                           t.created_at, t.updated_at
                    FROM todos t
                    WHERE t.id = ?
                    """,
                    (todo_id,)
                )
                todo_result = await cur.fetchone()

                return TodoResponse(
                    id=todo_result[0],
                    user_id=todo_result[1],
                    title=todo_result[2],
                    status=todo_result[3],
                    deadline=todo_result[4],
                    content=todo_result[5],
                    created_at=todo_result[6],
                    updated_at=todo_result[7],
                    tags=todo.tags
                )
    except Exception as e:
        logger.error(f"Error in create_todo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Todoの作成に失敗しました。", "error": str(e)}
        )

@app.get("/api/todos", response_model=List[TodoResponse])
async def get_todos(current_user: str = Depends(get_current_user)):
    try:
        async with await get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT t.id, t.user_id, t.title, t.status, t.deadline, t.content,
                           t.created_at, t.updated_at, GROUP_CONCAT(tg.name) as tags
                    FROM todos t
                    LEFT JOIN todo_tags tt ON t.id = tt.todo_id
                    LEFT JOIN tags tg ON tt.tag_id = tg.id
                    WHERE t.user_id = ?
                    GROUP BY t.id, t.user_id, t.title, t.status, t.deadline, t.content,
                             t.created_at, t.updated_at
                    ORDER BY t.created_at DESC
                    """,
                    (current_user,)
                )
                results = await cur.fetchall()

                return [
                    TodoResponse(
                        id=row[0],
                        user_id=row[1],
                        title=row[2],
                        status=row[3],
                        deadline=row[4],
                        content=row[5],
                        created_at=row[6],
                        updated_at=row[7],
                        tags=row[8].split(',') if row[8] else []
                    )
                    for row in results
                ]
    except Exception as e:
        logger.error(f"Error in get_todos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Todoの取得に失敗しました。", "error": str(e)}
        )

@app.put("/api/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: int, todo_update: TodoUpdate, current_user: str = Depends(get_current_user)):
    try:
        async with await get_connection() as conn:
            async with conn.cursor() as cur:
                # Check if todo exists and belongs to user
                await cur.execute(
                    "SELECT id FROM todos WHERE id = ? AND user_id = ?",
                    (todo_id, current_user)
                )
                if not await cur.fetchone():
                    raise HTTPException(status_code=404, detail="Todo not found")

                # Build update query dynamically
                update_fields = []
                params = []
                if todo_update.title is not None:
                    update_fields.append("title = ?")
                    params.append(todo_update.title)
                if todo_update.status is not None:
                    update_fields.append("status = ?")
                    params.append(todo_update.status)
                if todo_update.deadline is not None:
                    update_fields.append("deadline = ?")
                    params.append(todo_update.deadline)
                if todo_update.content is not None:
                    update_fields.append("content = ?")
                    params.append(todo_update.content)
                update_fields.append("updated_at = CURRENT_TIMESTAMP")

                if update_fields:
                    query = f"""
                        UPDATE todos
                        SET {", ".join(update_fields)}
                        WHERE id = ? AND user_id = ?
                    """
                    params.extend([todo_id, current_user])
                    await cur.execute(query, params)
                    await conn.commit()

                    if todo_update.tags is not None:
                        # Delete existing tags
                        await cur.execute(
                            "DELETE FROM todo_tags WHERE todo_id = ?",
                            (todo_id,)
                        )
                        await conn.commit()

                        # Add new tags
                        for tag_name in todo_update.tags:
                            # Insert tag if it doesn't exist
                            await cur.execute(
                                "INSERT OR IGNORE INTO tags (name) VALUES (?)",
                                (tag_name,)
                            )
                            await conn.commit()

                            # Get tag id
                            await cur.execute(
                                "SELECT id FROM tags WHERE name = ?",
                                (tag_name,)
                            )
                            tag_id = (await cur.fetchone())[0]

                            # Link todo with tag
                            await cur.execute(
                                "INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)",
                                (todo_id, tag_id)
                            )
                            await conn.commit()

                    # Get updated todo
                    await cur.execute(
                        """
                        SELECT t.id, t.user_id, t.title, t.status, t.deadline, t.content,
                               t.created_at, t.updated_at
                        FROM todos t
                        WHERE t.id = ?
                        """,
                        (todo_id,)
                    )
                    todo_result = await cur.fetchone()

                    return TodoResponse(
                        id=todo_result[0],
                        user_id=todo_result[1],
                        title=todo_result[2],
                        status=todo_result[3],
                        deadline=todo_result[4],
                        content=todo_result[5],
                        created_at=todo_result[6],
                        updated_at=todo_result[7],
                        tags=todo_update.tags if todo_update.tags is not None else []
                    )
    except Exception as e:
        logger.error(f"Error in update_todo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Todoの更新に失敗しました。", "error": str(e)}
        )

@app.delete("/api/todos/{todo_id}")
async def delete_todo(todo_id: int, current_user: str = Depends(get_current_user)):
    try:
        async with await get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT id FROM todos WHERE id = ? AND user_id = ?",
                    (todo_id, current_user)
                )
                if not await cur.fetchone():
                    raise HTTPException(status_code=404, detail="Todo not found")

                await cur.execute(
                    "DELETE FROM todos WHERE id = ? AND user_id = ?",
                    (todo_id, current_user)
                )
                await conn.commit()
                return {"message": "Todo deleted successfully"}
    except Exception as e:
        logger.error(f"Error in delete_todo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Todoの削除に失敗しました。", "error": str(e)}
        )

@app.post("/api/auth/request-reset", response_model=PasswordResetResponse)
async def request_password_reset(reset_request: PasswordResetRequest):
    try:
        async with await get_connection() as conn:
            async with conn.cursor() as cur:
                # Check if user exists
                await cur.execute(
                    "SELECT email FROM users WHERE id = ?",
                    (reset_request.id,)
                )
                result = await cur.fetchone()
                if not result:
                    raise HTTPException(
                        status_code=404,
                        detail={"message": "ユーザーが見つかりません。"}
                    )

                # In development mode, just return a success message
                reset_info = {
                    "message": "パスワードリセットリンクが送信されました。",
                    "reset_url": f"http://localhost:5173/reset-password?id={reset_request.id}"
                }
                return reset_info

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in request_password_reset: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "パスワードリセットの要求に失敗しました。", "error": str(e)}
        )

@app.post("/api/auth/reset-password", response_model=PasswordResetResponse)
async def confirm_password_reset(reset: PasswordResetConfirm):
    try:
        async with await get_connection() as conn:
            async with conn.cursor() as cur:
                # Check if user exists
                await cur.execute("SELECT id FROM users WHERE id = ?", (reset.id,))
                if not await cur.fetchone():
                    raise HTTPException(
                        status_code=404,
                        detail={"message": "ユーザーが見つかりません。"}
                    )

                # Update password
                hashed_password = get_password_hash(reset.new_password)
                await cur.execute(
                    "UPDATE users SET hashed_password = ? WHERE id = ?",
                    (hashed_password, reset.id)
                )
                await conn.commit()

                # Get updated user info
                await cur.execute(
                    "SELECT id, email, is_admin, created_at FROM users WHERE id = ?",
                    (reset.id,)
                )
                user = await cur.fetchone()

                return UserResponse(
                    id=user[0],
                    email=user[1],
                    is_admin=user[2],
                    created_at=user[3]
                )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in confirm_password_reset: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "パスワードの更新に失敗しました。", "error": str(e)}
        )

@app.get("/api/admin/users", response_model=List[UserResponse])
async def list_users(current_user: str = Depends(get_current_user)):
    try:
        async with await get_connection() as conn:
            async with conn.cursor() as cur:
                # Check if user is admin
                await cur.execute(
                    "SELECT is_admin FROM users WHERE id = ?",
                    (current_user,)
                )
                user_result = await cur.fetchone()
                if not user_result or not user_result[0]:
                    raise HTTPException(
                        status_code=403,
                        detail={"message": "管理者権限が必要です。"}
                    )

                # Get all users
                await cur.execute(
                    "SELECT id, email, is_admin, created_at FROM users ORDER BY created_at DESC"
                )
                users = await cur.fetchall()

                return [
                    UserResponse(
                        id=user[0],
                        email=user[1],
                        is_admin=user[2],
                        created_at=user[3]
                    )
                    for user in users
                ]

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in list_users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "ユーザー一覧の取得に失敗しました。", "error": str(e)}
        )

@app.put("/api/admin/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate, current_user: str = Depends(get_current_user)):
    try:
        async with await get_connection() as conn:
            async with conn.cursor() as cur:
                # Check if current user is admin
                await cur.execute(
                    "SELECT is_admin FROM users WHERE id = ?",
                    (current_user,)
                )
                admin_check = await cur.fetchone()
                if not admin_check or not admin_check[0]:
                    raise HTTPException(
                        status_code=403,
                        detail={"message": "管理者権限が必要です。"}
                    )

                # Check if user exists
                await cur.execute(
                    "SELECT id FROM users WHERE id = ?",
                    (user_id,)
                )
                if not await cur.fetchone():
                    raise HTTPException(
                        status_code=404,
                        detail={"message": "ユーザーが見つかりません。"}
                    )

                # Build update query
                update_fields = []
                params = []
                if user_update.email is not None:
                    update_fields.append("email = ?")
                    params.append(user_update.email)
                if user_update.is_admin is not None:
                    update_fields.append("is_admin = ?")
                    params.append(user_update.is_admin)

                if update_fields:
                    query = f"""
                        UPDATE users
                        SET {", ".join(update_fields)}
                        WHERE id = ?
                    """
                    params.append(user_id)
                    await cur.execute(query, params)
                    await conn.commit()

                # Get updated user
                await cur.execute(
                    "SELECT id, email, is_admin, created_at FROM users WHERE id = ?",
                    (user_id,)
                )
                user = await cur.fetchone()

                return UserResponse(
                    id=user[0],
                    email=user[1],
                    is_admin=user[2],
                    created_at=user[3]
                )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in update_user: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "ユーザー情報の更新に失敗しました。", "error": str(e)}
        )

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: str = Depends(get_current_user)):
    try:
        async with await get_connection() as conn:
            async with conn.cursor() as cur:
                # Check if current user is admin
                await cur.execute(
                    "SELECT is_admin FROM users WHERE id = ?",
                    (current_user,)
                )
                admin_check = await cur.fetchone()
                if not admin_check or not admin_check[0]:
                    raise HTTPException(
                        status_code=403,
                        detail={"message": "管理者権限が必要です。"}
                    )

                # Check if user exists
                await cur.execute(
                    "SELECT id FROM users WHERE id = ?",
                    (user_id,)
                )
                if not await cur.fetchone():
                    raise HTTPException(
                        status_code=404,
                        detail={"message": "ユーザーが見つかりません。"}
                    )

                # Delete user
                await cur.execute(
                    "DELETE FROM users WHERE id = ?",
                    (user_id,)
                )
                await conn.commit()
                return {"message": "ユーザーが正常に削除されました。"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in delete_user: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "ユーザーの削除に失敗しました。", "error": str(e)}
        )
