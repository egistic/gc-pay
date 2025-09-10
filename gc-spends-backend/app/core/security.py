from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.db import get_db
from app.models import User, UserRole
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
    """Get current user with roles"""
    from sqlalchemy.orm import joinedload
    
    user = db.query(User).options(
        joinedload(User.user_roles).joinedload(UserRole.role)
    ).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Convert user_roles to UserRoleOut objects
    user_roles = []
    for user_role in user.user_roles:
        user_roles.append(UserRoleOut(
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
        user_roles=user_roles
    )
