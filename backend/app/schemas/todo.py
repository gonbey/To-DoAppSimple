from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class TodoBase(BaseModel):
    title: str
    status: str  # "未完了", "進行中", "完了"
    deadline: datetime
    content: str
    tags: List[str]

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class TodoResponse(TodoBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime
