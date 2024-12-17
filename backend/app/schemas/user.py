from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List

class UserCreate(BaseModel):
    id: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    is_admin: bool = False
    created_at: datetime | None = None

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = None
    is_admin: bool | None = None

class UserListResponse(BaseModel):
    users: List[UserResponse]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: str | None = None
