from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: str
    is_admin: bool
    created_at: datetime

class UserListResponse(BaseModel):
    users: List[UserResponse]
