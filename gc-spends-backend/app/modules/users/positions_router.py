from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models import Position, Department, User, UserPosition, Role, UserRole
from . import schemas
from .schemas import DepartmentOut, DepartmentCreate, DepartmentUpdate, PositionOut, PositionCreate, PositionUpdate
from datetime import date
from typing import List
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/positions", tags=["positions"])

# Department Management (must be before position routes with parameters)
@router.get("/departments", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    """Получить список всех департаментов"""
    departments = db.query(Department).order_by(Department.name).all()
    return [DepartmentOut(
        id=dept.id,
        name=dept.name,
        code=dept.code
    ) for dept in departments]

@router.post("/departments", response_model=DepartmentOut, status_code=201)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    """Создать новый департамент"""
    # Проверяем уникальность кода
    existing = db.query(Department).filter(Department.code == department.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department code already exists")
    
    new_department = Department(
        name=department.name,
        code=department.code
    )
    
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    
    return DepartmentOut(
        id=new_department.id,
        name=new_department.name,
        code=new_department.code
    )

@router.put("/departments/{department_id}", response_model=DepartmentOut)
def update_department(
    department_id: uuid.UUID,
    department_update: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    """Обновить департамент"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    
    # Проверяем уникальность кода, если он обновляется
    if department_update.code and department_update.code != department.code:
        existing = db.query(Department).filter(Department.code == department_update.code).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department code already exists")
        department.code = department_update.code
    
    if department_update.name is not None:
        department.name = department_update.name
    
    db.commit()
    db.refresh(department)
    
    return DepartmentOut(
        id=department.id,
        name=department.name,
        code=department.code
    )

@router.delete("/departments/{department_id}", status_code=204)
def delete_department(
    department_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    """Удалить департамент"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    
    # Проверяем, что департамент не используется в позициях
    positions = db.query(Position).filter(Position.department_id == department_id).first()
    if positions:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete department that has positions"
        )
    
    db.delete(department)
    db.commit()
    return None

# Position Schemas
class PositionCreate(BaseModel):
    department_id: uuid.UUID
    title: str
    description: str | None = None
    is_active: bool = True

class PositionUpdate(BaseModel):
    department_id: uuid.UUID | None = None
    title: str | None = None
    description: str | None = None
    is_active: bool | None = None

class PositionOut(BaseModel):
    id: uuid.UUID
    department_id: uuid.UUID
    title: str
    description: str | None = None
    is_active: bool
    department: dict | None = None

class UserPositionAssign(BaseModel):
    user_id: uuid.UUID
    position_id: uuid.UUID
    valid_from: date
    valid_to: date | None = None

class UserPositionOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    position_id: uuid.UUID
    valid_from: date
    valid_to: date | None = None
    user: dict | None = None
    position: dict | None = None

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

# Position Management
@router.get("", response_model=List[PositionOut])
def list_positions(db: Session = Depends(get_db)):
    """Получить список всех позиций"""
    positions = db.query(Position).options(
        joinedload(Position.department)
    ).order_by(Position.title).all()
    
    result = []
    for position in positions:
        result.append(PositionOut(
            id=position.id,
            department_id=position.department_id,
            title=position.title,
            description=position.description,
            is_active=position.is_active,
            department={
                "id": str(position.department.id),
                "name": position.department.name,
                "code": position.department.code
            } if position.department else None
        ))
    
    return result

@router.get("/{position_id}", response_model=PositionOut)
def get_position(position_id: uuid.UUID, db: Session = Depends(get_db)):
    """Получить позицию по ID"""
    position = db.query(Position).options(
        joinedload(Position.department)
    ).filter(Position.id == position_id).first()
    
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    
    return PositionOut(
        id=position.id,
        department_id=position.department_id,
        title=position.title,
        description=position.description,
        is_active=position.is_active,
        department={
            "id": str(position.department.id),
            "name": position.department.name,
            "code": position.department.code
        } if position.department else None
    )

@router.post("", response_model=PositionOut, status_code=201)
def create_position(
    position: PositionCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    """Создать новую позицию"""
    # Проверяем, что департамент существует
    department = db.query(Department).filter(Department.id == position.department_id).first()
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    
    new_position = Position(
        department_id=position.department_id,
        title=position.title,
        description=position.description,
        is_active=position.is_active
    )
    
    db.add(new_position)
    db.commit()
    db.refresh(new_position)
    
    return PositionOut(
        id=new_position.id,
        department_id=new_position.department_id,
        title=new_position.title,
        description=new_position.description,
        is_active=new_position.is_active,
        department={
            "id": str(department.id),
            "name": department.name,
            "code": department.code
        }
    )

@router.put("/{position_id}", response_model=PositionOut)
def update_position(
    position_id: uuid.UUID,
    position_update: PositionUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    """Обновить позицию"""
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    
    # Проверяем департамент, если он обновляется
    if position_update.department_id and position_update.department_id != position.department_id:
        department = db.query(Department).filter(Department.id == position_update.department_id).first()
        if not department:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
        position.department_id = position_update.department_id
    
    if position_update.title is not None:
        position.title = position_update.title
    if position_update.description is not None:
        position.description = position_update.description
    if position_update.is_active is not None:
        position.is_active = position_update.is_active
    
    db.commit()
    db.refresh(position)
    
    # Загружаем связанный департамент
    position = db.query(Position).options(
        joinedload(Position.department)
    ).filter(Position.id == position_id).first()
    
    return PositionOut(
        id=position.id,
        department_id=position.department_id,
        title=position.title,
        description=position.description,
        is_active=position.is_active,
        department={
            "id": str(position.department.id),
            "name": position.department.name,
            "code": position.department.code
        } if position.department else None
    )

@router.delete("/{position_id}", status_code=204)
def delete_position(
    position_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    """Удалить позицию"""
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    
    # Проверяем, что позиция не назначена пользователям
    user_positions = db.query(UserPosition).filter(UserPosition.position_id == position_id).first()
    if user_positions:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete position that is assigned to users"
        )
    
    db.delete(position)
    db.commit()
    return None

# User Position Assignment
@router.post("/{position_id}/assign-user", response_model=UserPositionOut)
def assign_user_to_position(
    position_id: uuid.UUID,
    assignment: UserPositionAssign,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Назначить пользователя на позицию"""
    # Проверяем, что позиция существует
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    
    # Проверяем, что пользователь существует
    user = db.query(User).filter(User.id == assignment.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Удаляем существующие назначения пользователя на любые позиции
    existing_assignments = db.query(UserPosition).filter(
        UserPosition.user_id == assignment.user_id
    ).all()
    
    for existing in existing_assignments:
        db.delete(existing)
    
    # Создаем новое назначение
    new_assignment = UserPosition(
        user_id=assignment.user_id,
        position_id=position_id,
        valid_from=assignment.valid_from,
        valid_to=assignment.valid_to
    )
    
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    # Загружаем связанные объекты отдельно
    user = db.query(User).filter(User.id == assignment.user_id).first()
    
    return UserPositionOut(
        id=new_assignment.id,
        user_id=new_assignment.user_id,
        position_id=new_assignment.position_id,
        valid_from=new_assignment.valid_from,
        valid_to=new_assignment.valid_to,
        user={
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email
        } if user else None,
        position={
            "id": str(position.id),
            "title": position.title,
            "description": position.description
        }
    )

@router.get("/{position_id}/users", response_model=List[UserPositionOut])
def get_position_users(
    position_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Получить всех пользователей, назначенных на позицию"""
    # Проверяем, что позиция существует
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    
    # Получаем все назначения пользователей на позицию
    assignments = db.query(UserPosition).filter(UserPosition.position_id == position_id).all()
    
    result = []
    for assignment in assignments:
        # Загружаем пользователя отдельно
        user = db.query(User).filter(User.id == assignment.user_id).first()
        
        result.append(UserPositionOut(
            id=assignment.id,
            user_id=assignment.user_id,
            position_id=assignment.position_id,
            valid_from=assignment.valid_from,
            valid_to=assignment.valid_to,
            user={
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email
            } if user else None,
            position={
                "id": str(position.id),
                "title": position.title,
                "description": position.description
            }
        ))
    
    return result

@router.delete("/assignments/{assignment_id}", status_code=204)
def remove_user_from_position(
    assignment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Удалить назначение пользователя на позицию"""
    assignment = db.query(UserPosition).filter(UserPosition.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    return None

