import uuid
from datetime import date, datetime
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

# Expense Article Role Assignment Schemas
class ExpenseArticleRoleAssignmentCreate(BaseModel):
    article_id: uuid.UUID
    user_id: uuid.UUID
    role_id: uuid.UUID
    is_primary: bool = False
    valid_from: date
    valid_to: date | None = None

class ExpenseArticleRoleAssignmentUpdate(BaseModel):
    is_primary: bool | None = None
    valid_from: date | None = None
    valid_to: date | None = None

class ExpenseArticleRoleAssignmentOut(BaseModel):
    id: uuid.UUID
    article_id: uuid.UUID
    user_id: uuid.UUID
    role_id: uuid.UUID
    is_primary: bool
    valid_from: date
    valid_to: date | None = None
    created_at: datetime
    updated_at: datetime
    # Nested objects
    article: dict | None = None
    user: dict | None = None
    role: dict | None = None

class ExpenseArticleWithRoles(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    role_assignments: List[ExpenseArticleRoleAssignmentOut] = []

class UserWithArticleRoles(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: str | None = None
    is_active: bool
    article_assignments: List[ExpenseArticleRoleAssignmentOut] = []

# Department Schemas
class DepartmentCreate(BaseModel):
    name: str
    code: str

class DepartmentUpdate(BaseModel):
    name: str | None = None
    code: str | None = None

class DepartmentOut(BaseModel):
    id: uuid.UUID
    name: str
    code: str

# Position Schemas
class PositionCreate(BaseModel):
    name: str
    code: str
    department_id: uuid.UUID

class PositionUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    department_id: uuid.UUID | None = None

class PositionOut(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    department_id: uuid.UUID
    department: DepartmentOut | None = None
