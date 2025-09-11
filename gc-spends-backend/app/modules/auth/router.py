from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.core.db import get_db
from app.core.security import verify_password, create_access_token, get_current_user_id
from app.models import User, UserRole, Role
from app.modules.users.schemas import UserOut, UserRoleOut, RoleOut
from datetime import date

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", summary="Вход в систему", response_description="JWT токен и информация о пользователе")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Аутентификация пользователя в системе.
    
    Принимает email и пароль, возвращает JWT токен для дальнейшей авторизации.
    
    - **username**: email пользователя
    - **password**: пароль пользователя
    
    Возвращает:
    - access_token: JWT токен для авторизации
    - token_type: тип токена (bearer)
    - user: информация о пользователе с ролями
    """
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Получаем активные роли пользователя
    user_roles = db.query(UserRole).filter(
        and_(
            UserRole.user_id == user.id,
            UserRole.valid_from <= date.today(),
            UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
        )
    ).all()
    
    roles = []
    for user_role in user_roles:
        role = db.query(Role).filter(Role.id == user_role.role_id).first()
        if role:
            roles.append({
                "id": str(role.id),
                "code": role.code,
                "name": role.name,
                "is_primary": user_role.is_primary
            })
    
    token = create_access_token(str(user.id))
    
    # Возвращаем информацию о пользователе с ролями
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "is_active": user.is_active,
            "roles": roles
        }
    }

@router.get("/me", summary="Получить информацию о текущем пользователе")
def get_current_user_info(current_user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """
    Получить информацию о текущем аутентифицированном пользователе.
    
    Требует JWT токен в заголовке Authorization.
    
    Возвращает:
    - id: уникальный идентификатор пользователя
    - email: email пользователя
    - full_name: полное имя пользователя
    - phone: номер телефона
    - is_active: статус активности
    - roles: список ролей пользователя
    """
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Получаем активные роли пользователя
    user_roles = db.query(UserRole).filter(
        and_(
            UserRole.user_id == user.id,
            UserRole.valid_from <= date.today(),
            UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
        )
    ).all()
    
    roles = []
    for user_role in user_roles:
        role = db.query(Role).filter(Role.id == user_role.role_id).first()
        if role:
            roles.append({
                "id": str(role.id),
                "code": role.code,
                "name": role.name,
                "is_primary": user_role.is_primary
            })
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "is_active": user.is_active,
        "roles": roles
    }
