from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.core.config import settings
from app.core.db import get_db
from app.models import User, UserRole, Role
from app.modules.users.schemas import UserOut, UserRoleOut, RoleOut

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_prefix}/auth/login")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes or settings.jwt_expire_minutes)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        sub: Optional[str] = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return sub

def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> UserOut:
    """Get current user with active roles"""
    from sqlalchemy.orm import joinedload
    from datetime import date
    
    user = db.query(User).options(
        joinedload(User.user_roles).joinedload(UserRole.role)
    ).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Get only active roles (valid today)
    active_user_roles = []
    for user_role in user.user_roles:
        # Check if role is currently valid
        if (user_role.valid_from <= date.today() and 
            (user_role.valid_to is None or user_role.valid_to >= date.today())):
            active_user_roles.append(UserRoleOut(
                id=user_role.id,
                role_id=user_role.role_id,
                valid_from=user_role.valid_from,
                valid_to=user_role.valid_to,
                is_primary=user_role.is_primary,
                role=RoleOut(
                    id=user_role.role.id,
                    code=user_role.role.code,
                    name=user_role.role.name
                )
            ))
    
    return UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        user_roles=active_user_roles
    )

def get_current_user_roles(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> list[str]:
    """Get current user's role codes"""
    from datetime import date
    
    user_roles = db.query(UserRole).join(Role).filter(
        and_(
            UserRole.user_id == user_id,
            UserRole.valid_from <= date.today(),
            UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
        )
    ).all()
    
    return [user_role.role.code for user_role in user_roles]

def require_roles(*required_roles: str):
    """Dependency to require specific roles"""
    def role_checker(
        current_user: UserOut = Depends(get_current_user)
    ) -> UserOut:
        user_roles = [role.role.code for role in current_user.user_roles]
        
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(required_roles)}"
            )
        
        return current_user
    
    return role_checker
