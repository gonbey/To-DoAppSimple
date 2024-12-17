from pydantic import BaseModel

class PasswordResetRequest(BaseModel):
    id: str

class PasswordResetResponse(BaseModel):
    message: str
    reset_url: str | None = None

class PasswordResetConfirm(BaseModel):
    id: str
    new_password: str
