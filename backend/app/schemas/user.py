from datetime import datetime
from pydantic import BaseModel, EmailStr

from ..models.user import UserRole


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = ""
    role: UserRole = UserRole.read_only


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: str
    password: str
