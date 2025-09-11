from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models import ExpenseArticle, User, Role, ExpenseArticleRoleAssignment
from . import schemas
from datetime import date
from typing import List
import uuid

router = APIRouter(prefix="/expense-article-roles", tags=["expense-article-roles"])

@router.get("/articles/{article_id}/assignments", response_model=List[schemas.ExpenseArticleRoleAssignmentOut])
def get_article_role_assignments(
    article_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Получить все назначения ролей для конкретной статьи расходов"""
    # Проверяем, что статья существует
    article = db.query(ExpenseArticle).filter(ExpenseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense article not found")
    
    # Получаем все назначения ролей для статьи
    assignments = db.query(ExpenseArticleRoleAssignment).options(
        joinedload(ExpenseArticleRoleAssignment.user),
        joinedload(ExpenseArticleRoleAssignment.role),
        joinedload(ExpenseArticleRoleAssignment.article)
    ).filter(ExpenseArticleRoleAssignment.article_id == article_id).all()
    
    result = []
    for assignment in assignments:
        result.append(schemas.ExpenseArticleRoleAssignmentOut(
            id=assignment.id,
            article_id=assignment.article_id,
            user_id=assignment.user_id,
            role_id=assignment.role_id,
            is_primary=assignment.is_primary,
            valid_from=assignment.valid_from,
            valid_to=assignment.valid_to,
            created_at=assignment.created_at,
            updated_at=assignment.updated_at,
            article={
                "id": str(assignment.article.id),
                "code": assignment.article.code,
                "name": assignment.article.name
            } if assignment.article else None,
            user={
                "id": str(assignment.user.id),
                "full_name": assignment.user.full_name,
                "email": assignment.user.email
            } if assignment.user else None,
            role={
                "id": str(assignment.role.id),
                "code": assignment.role.code,
                "name": assignment.role.name
            } if assignment.role else None
        ))
    
    return result

@router.get("/users/{user_id}/assignments", response_model=List[schemas.ExpenseArticleRoleAssignmentOut])
def get_user_article_assignments(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Получить все назначения статей расходов для конкретного пользователя"""
    # Проверяем, что пользователь существует
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Получаем все назначения статей для пользователя
    assignments = db.query(ExpenseArticleRoleAssignment).options(
        joinedload(ExpenseArticleRoleAssignment.user),
        joinedload(ExpenseArticleRoleAssignment.role),
        joinedload(ExpenseArticleRoleAssignment.article)
    ).filter(ExpenseArticleRoleAssignment.user_id == user_id).all()
    
    result = []
    for assignment in assignments:
        result.append(schemas.ExpenseArticleRoleAssignmentOut(
            id=assignment.id,
            article_id=assignment.article_id,
            user_id=assignment.user_id,
            role_id=assignment.role_id,
            is_primary=assignment.is_primary,
            valid_from=assignment.valid_from,
            valid_to=assignment.valid_to,
            created_at=assignment.created_at,
            updated_at=assignment.updated_at,
            article={
                "id": str(assignment.article.id),
                "code": assignment.article.code,
                "name": assignment.article.name
            } if assignment.article else None,
            user={
                "id": str(assignment.user.id),
                "full_name": assignment.user.full_name,
                "email": assignment.user.email
            } if assignment.user else None,
            role={
                "id": str(assignment.role.id),
                "code": assignment.role.code,
                "name": assignment.role.name
            } if assignment.role else None
        ))
    
    return result

@router.post("/assign", response_model=schemas.ExpenseArticleRoleAssignmentOut)
def assign_role_to_article(
    assignment: schemas.ExpenseArticleRoleAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    """Назначить роль пользователя к статье расходов"""
    # Проверяем, что статья существует
    article = db.query(ExpenseArticle).filter(ExpenseArticle.id == assignment.article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense article not found")
    
    # Проверяем, что пользователь существует
    user = db.query(User).filter(User.id == assignment.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Проверяем, что роль существует
    role = db.query(Role).filter(Role.id == assignment.role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    # Проверяем, что пользователь уже не назначен к этой статье с этой ролью
    existing = db.query(ExpenseArticleRoleAssignment).filter(
        and_(
            ExpenseArticleRoleAssignment.article_id == assignment.article_id,
            ExpenseArticleRoleAssignment.user_id == assignment.user_id,
            ExpenseArticleRoleAssignment.role_id == assignment.role_id,
            ExpenseArticleRoleAssignment.valid_from <= assignment.valid_from,
            ExpenseArticleRoleAssignment.valid_to.is_(None) | (ExpenseArticleRoleAssignment.valid_to >= assignment.valid_from)
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="User already assigned to this article with this role in the specified period"
        )
    
    # Создаем новое назначение
    new_assignment = ExpenseArticleRoleAssignment(
        article_id=assignment.article_id,
        user_id=assignment.user_id,
        role_id=assignment.role_id,
        is_primary=assignment.is_primary,
        valid_from=assignment.valid_from,
        valid_to=assignment.valid_to
    )
    
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    # Загружаем связанные объекты
    db.refresh(new_assignment)
    new_assignment = db.query(ExpenseArticleRoleAssignment).options(
        joinedload(ExpenseArticleRoleAssignment.user),
        joinedload(ExpenseArticleRoleAssignment.role),
        joinedload(ExpenseArticleRoleAssignment.article)
    ).filter(ExpenseArticleRoleAssignment.id == new_assignment.id).first()
    
    return schemas.ExpenseArticleRoleAssignmentOut(
        id=new_assignment.id,
        article_id=new_assignment.article_id,
        user_id=new_assignment.user_id,
        role_id=new_assignment.role_id,
        is_primary=new_assignment.is_primary,
        valid_from=new_assignment.valid_from,
        valid_to=new_assignment.valid_to,
        created_at=new_assignment.created_at,
        updated_at=new_assignment.updated_at,
        article={
            "id": str(new_assignment.article.id),
            "code": new_assignment.article.code,
            "name": new_assignment.article.name
        } if new_assignment.article else None,
        user={
            "id": str(new_assignment.user.id),
            "full_name": new_assignment.user.full_name,
            "email": new_assignment.user.email
        } if new_assignment.user else None,
        role={
            "id": str(new_assignment.role.id),
            "code": new_assignment.role.code,
            "name": new_assignment.role.name
        } if new_assignment.role else None
    )

@router.put("/assignments/{assignment_id}", response_model=schemas.ExpenseArticleRoleAssignmentOut)
def update_article_role_assignment(
    assignment_id: uuid.UUID,
    assignment_update: schemas.ExpenseArticleRoleAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    """Обновить назначение роли к статье расходов"""
    assignment = db.query(ExpenseArticleRoleAssignment).filter(
        ExpenseArticleRoleAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    # Обновляем поля
    if assignment_update.is_primary is not None:
        assignment.is_primary = assignment_update.is_primary
    if assignment_update.valid_from is not None:
        assignment.valid_from = assignment_update.valid_from
    if assignment_update.valid_to is not None:
        assignment.valid_to = assignment_update.valid_to
    
    db.commit()
    db.refresh(assignment)
    
    # Загружаем связанные объекты
    assignment = db.query(ExpenseArticleRoleAssignment).options(
        joinedload(ExpenseArticleRoleAssignment.user),
        joinedload(ExpenseArticleRoleAssignment.role),
        joinedload(ExpenseArticleRoleAssignment.article)
    ).filter(ExpenseArticleRoleAssignment.id == assignment_id).first()
    
    return schemas.ExpenseArticleRoleAssignmentOut(
        id=assignment.id,
        article_id=assignment.article_id,
        user_id=assignment.user_id,
        role_id=assignment.role_id,
        is_primary=assignment.is_primary,
        valid_from=assignment.valid_from,
        valid_to=assignment.valid_to,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at,
        article={
            "id": str(assignment.article.id),
            "code": assignment.article.code,
            "name": assignment.article.name
        } if assignment.article else None,
        user={
            "id": str(assignment.user.id),
            "full_name": assignment.user.full_name,
            "email": assignment.user.email
        } if assignment.user else None,
        role={
            "id": str(assignment.role.id),
            "code": assignment.role.code,
            "name": assignment.role.name
        } if assignment.role else None
    )

@router.delete("/assignments/{assignment_id}", status_code=204)
def delete_article_role_assignment(
    assignment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(require_roles("ADMIN"))
):
    """Удалить назначение роли к статье расходов"""
    assignment = db.query(ExpenseArticleRoleAssignment).filter(
        ExpenseArticleRoleAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    return None

@router.get("/articles/{article_id}/users", response_model=List[schemas.UserWithArticleRoles])
def get_article_users(
    article_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Получить всех пользователей, назначенных к статье расходов"""
    # Проверяем, что статья существует
    article = db.query(ExpenseArticle).filter(ExpenseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense article not found")
    
    # Получаем всех пользователей, назначенных к статье
    assignments = db.query(ExpenseArticleRoleAssignment).options(
        joinedload(ExpenseArticleRoleAssignment.user),
        joinedload(ExpenseArticleRoleAssignment.role),
        joinedload(ExpenseArticleRoleAssignment.article)
    ).filter(ExpenseArticleRoleAssignment.article_id == article_id).all()
    
    # Группируем по пользователям
    user_assignments = {}
    for assignment in assignments:
        user_id = str(assignment.user_id)
        if user_id not in user_assignments:
            user_assignments[user_id] = {
                "user": assignment.user,
                "assignments": []
            }
        user_assignments[user_id]["assignments"].append(assignment)
    
    result = []
    for user_id, data in user_assignments.items():
        user = data["user"]
        assignments = data["assignments"]
        
        assignment_outs = []
        for assignment in assignments:
            assignment_outs.append(schemas.ExpenseArticleRoleAssignmentOut(
                id=assignment.id,
                article_id=assignment.article_id,
                user_id=assignment.user_id,
                role_id=assignment.role_id,
                is_primary=assignment.is_primary,
                valid_from=assignment.valid_from,
                valid_to=assignment.valid_to,
                created_at=assignment.created_at,
                updated_at=assignment.updated_at,
                article={
                    "id": str(assignment.article.id),
                    "code": assignment.article.code,
                    "name": assignment.article.name
                } if assignment.article else None,
                user={
                    "id": str(assignment.user.id),
                    "full_name": assignment.user.full_name,
                    "email": assignment.user.email
                } if assignment.user else None,
                role={
                    "id": str(assignment.role.id),
                    "code": assignment.role.code,
                    "name": assignment.role.name
                } if assignment.role else None
            ))
        
        result.append(schemas.UserWithArticleRoles(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            article_assignments=assignment_outs
        ))
    
    return result
