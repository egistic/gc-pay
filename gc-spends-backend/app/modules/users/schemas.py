import uuid
from datetime import date
from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    password: str

class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    is_active: bool | None = None

class RoleCreate(BaseModel):
    code: str
    name: str

class RoleOut(BaseModel):
    id: uuid.UUID
    code: str
    name: str

class UserRoleOut(BaseModel):
    id: uuid.UUID
    role_id: uuid.UUID
    valid_from: date
    valid_to: date | None = None
    is_primary: bool
    role: RoleOut

class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: str | None = None
    is_active: bool
    user_roles: List[UserRoleOut] = []

class UserRoleAssign(BaseModel):
    role_id: uuid.UUID
    valid_from: date
    valid_to: date | None = None
    is_primary: bool = False

class UserWithRoles(UserOut):
    roles: List[RoleOut] = []
