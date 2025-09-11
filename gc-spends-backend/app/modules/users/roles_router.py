from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models import Role, UserRole
from . import schemas
import uuid

router = APIRouter(prefix="/roles", tags=["roles"])

@router.get("", response_model=list[schemas.RoleOut])
def list_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).order_by(Role.name).all()
    return [schemas.RoleOut.model_validate(role.__dict__) for role in roles]

@router.get("/{role_id}", response_model=schemas.RoleOut)
def get_role(role_id: uuid.UUID, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return schemas.RoleOut.model_validate(role.__dict__)

@router.post("", response_model=schemas.RoleOut, status_code=201)
def create_role(
    payload: schemas.RoleCreate, 
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    # Check if role code already exists
    exists = db.query(Role).filter(Role.code == payload.code).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role code already exists")
    
    role = Role(
        code=payload.code,
        name=payload.name
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return schemas.RoleOut.model_validate(role.__dict__)

@router.put("/{role_id}", response_model=schemas.RoleOut)
def update_role(
    role_id: uuid.UUID, 
    payload: schemas.RoleCreate, 
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    # Check if new code already exists (if code is being changed)
    if payload.code != role.code:
        exists = db.query(Role).filter(Role.code == payload.code).first()
        if exists:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role code already exists")
    
    role.code = payload.code
    role.name = payload.name
    
    db.commit()
    db.refresh(role)
    return schemas.RoleOut.model_validate(role.__dict__)

@router.delete("/{role_id}", status_code=204)
def delete_role(
    role_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    # Check if role is assigned to any users
    user_roles = db.query(UserRole).filter(UserRole.role_id == role_id).first()
    if user_roles:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Cannot delete role that is assigned to users"
        )
    
    db.delete(role)
    db.commit()
    return None
