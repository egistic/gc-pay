from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.core.db import get_db
from app.core.security import hash_password, get_current_user, require_roles
from app.models import User, Role, UserRole
from . import schemas
import uuid
from datetime import date

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", response_model=schemas.UserOut, status_code=201)
def create_user(
    payload: schemas.UserCreate, 
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.UserOut.model_validate(user.__dict__)

@router.get("", response_model=list[schemas.UserWithRoles])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.full_name).all()
    result = []
    
    for user in users:
        # Get user roles
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
                roles.append(schemas.RoleOut.model_validate(role.__dict__))
        
        user_data = schemas.UserOut.model_validate(user.__dict__)
        result.append(schemas.UserWithRoles(**user_data.model_dump(), roles=roles))
    
    return result

@router.get("/{user_id}", response_model=schemas.UserWithRoles)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Get user roles
    user_roles = db.query(UserRole).filter(
        and_(
            UserRole.user_id == user_id,
            UserRole.valid_from <= date.today(),
            UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
        )
    ).all()
    
    roles = []
    for user_role in user_roles:
        role = db.query(Role).filter(Role.id == user_role.role_id).first()
        if role:
            roles.append(schemas.RoleOut.model_validate(role.__dict__))
    
    user_data = schemas.UserOut.model_validate(user.__dict__)
    return schemas.UserWithRoles(**user_data.model_dump(), roles=roles)

@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: uuid.UUID, 
    payload: schemas.UserUpdate, 
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Check email uniqueness if email is being updated
    if payload.email and payload.email != user.email:
        exists = db.query(User).filter(User.email == payload.email).first()
        if exists:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    
    # Update fields
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = payload.email
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.is_active is not None:
        user.is_active = payload.is_active
    
    db.commit()
    db.refresh(user)
    return schemas.UserOut.model_validate(user.__dict__)

@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    db.delete(user)
    db.commit()
    return None

@router.get("/roles", response_model=list[schemas.RoleOut])
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).order_by(Role.name).all()
    return [schemas.RoleOut.model_validate(role.__dict__) for role in roles]

@router.post("/{user_id}/roles", response_model=schemas.UserWithRoles)
def assign_role_to_user(
    user_id: uuid.UUID, 
    payload: schemas.UserRoleAssign, 
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Check if role exists
    role = db.query(Role).filter(Role.id == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    # Check if user already has this role
    existing_role = db.query(UserRole).filter(
        and_(
            UserRole.user_id == user_id,
            UserRole.role_id == payload.role_id,
            UserRole.valid_from <= date.today(),
            UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
        )
    ).first()
    
    if existing_role:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already has this role")
    
    # Create user role assignment
    user_role = UserRole(
        user_id=user_id,
        role_id=payload.role_id,
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
        is_primary=payload.is_primary
    )
    
    db.add(user_role)
    db.commit()
    
    # Return updated user with roles
    return get_user(user_id, db)
