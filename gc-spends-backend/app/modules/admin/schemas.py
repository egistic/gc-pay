import uuid
from datetime import date, datetime
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

# System Statistics
class SystemStatistics(BaseModel):
    total_users: int
    active_users: int
    total_roles: int
    total_requests: int
    system_health: str  # 'healthy' | 'warning' | 'error'

# Activity Log
class ActivityLog(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str
    action: str
    resource: str
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None

# User Search Parameters
class UserSearchParams(BaseModel):
    query: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    page: int = 1
    limit: int = 20

# User Create (for bulk operations)
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    roles: Optional[List['UserRoleAssign']] = []

# User Update (for bulk operations)
class UserUpdate(BaseModel):
    id: uuid.UUID
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

# User Role Assignment
class UserRoleAssign(BaseModel):
    role_id: uuid.UUID
    valid_from: date
    valid_to: Optional[date] = None
    is_primary: bool = False

# Bulk Operations
class BulkUserCreate(BaseModel):
    users: List[UserCreate]

class BulkUserUpdate(BaseModel):
    users: List[UserUpdate]

class BulkUserDelete(BaseModel):
    user_ids: List[uuid.UUID]

# Permission System
class Permission(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: str
    resource: str

class RolePermission(BaseModel):
    role_id: uuid.UUID
    permission_id: uuid.UUID

# Role Usage Statistics
class RoleUsage(BaseModel):
    role_id: uuid.UUID
    role_name: str
    user_count: int
    last_assigned: Optional[datetime] = None
    is_active: bool

class RoleStatistics(BaseModel):
    total_roles: int
    active_roles: int
    most_used_role: Optional[str] = None
    least_used_role: Optional[str] = None

# User with Roles (extended)
class UserWithRoles(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    is_active: bool
    roles: List['RoleOut'] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

class RoleOut(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

# Update forward references
UserRoleAssign.model_rebuild()
UserWithRoles.model_rebuild()
