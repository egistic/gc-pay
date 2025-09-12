from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, desc, or_
from app.core.db import get_db
from app.models import User, Role, UserRole, PaymentRequest, Position, Department, UserPosition
from . import schemas
import uuid
from datetime import date, datetime, timedelta
from typing import List, Optional

router = APIRouter(prefix="/admin", tags=["admin"])

# System Statistics
@router.get("/statistics", response_model=schemas.SystemStatistics)
def get_system_statistics(db: Session = Depends(get_db)):
    """Get system-wide statistics for admin dashboard"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_roles = db.query(Role).count()
    total_requests = db.query(PaymentRequest).filter(PaymentRequest.deleted == False).count()
    
    # Simple health check - in production this would be more sophisticated
    system_health = "healthy" if total_users > 0 else "warning"
    
    return schemas.SystemStatistics(
        total_users=total_users,
        active_users=active_users,
        total_roles=total_roles,
        total_requests=total_requests,
        system_health=system_health
    )

# Activity Log (simplified implementation)
@router.get("/activity-log", response_model=List[schemas.ActivityLog])
def get_activity_log(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get recent system activity log"""
    # This is a simplified implementation
    # In production, you'd have a proper activity log table
    activities = []
    
    # Get recent user creations
    recent_users = db.query(User).order_by(desc(User.created_at)).limit(limit // 2).all()
    for user in recent_users:
        activities.append(schemas.ActivityLog(
            id=uuid.uuid4(),
            user_id=user.id,
            user_name=user.full_name,
            action="user_created",
            resource="users",
            timestamp=user.created_at or datetime.now(),
            details={"email": user.email}
        ))
    
    # Get recent role assignments
    recent_roles = db.query(UserRole).order_by(desc(UserRole.created_at)).limit(limit // 2).all()
    for user_role in recent_roles:
        user = db.query(User).filter(User.id == user_role.user_id).first()
        role = db.query(Role).filter(Role.id == user_role.role_id).first()
        if user and role:
            activities.append(schemas.ActivityLog(
                id=uuid.uuid4(),
                user_id=user.id,
                user_name=user.full_name,
                action="role_assigned",
                resource="roles",
                timestamp=user_role.created_at or datetime.now(),
                details={"role": role.name}
            ))
    
    # Sort by timestamp and return limited results
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    return activities[:limit]

# User Search and Filtering
@router.get("/users/search", response_model=List[schemas.UserWithRoles])
def search_users(
    query: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role code"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search and filter users with pagination"""
    query_obj = db.query(User)
    
    # Apply filters
    if query:
        query_obj = query_obj.filter(
            or_(
                User.full_name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%")
            )
        )
    
    if is_active is not None:
        query_obj = query_obj.filter(User.is_active == is_active)
    
    if role:
        # Join with UserRole and Role tables
        query_obj = query_obj.join(UserRole).join(Role).filter(Role.code == role)
    
    # Apply pagination
    offset = (page - 1) * limit
    users = query_obj.offset(offset).limit(limit).all()
    
    # Convert to response format
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
            role_obj = db.query(Role).filter(Role.id == user_role.role_id).first()
            if role_obj:
                roles.append(schemas.RoleOut(
                    id=role_obj.id,
                    code=role_obj.code,
                    name=role_obj.name,
                    is_active=True,
                    created_at=role_obj.created_at or datetime.now(),
                    updated_at=role_obj.updated_at
                ))
        
        # Get user position
        user_position = db.query(UserPosition).filter(
            and_(
                UserPosition.user_id == user.id,
                UserPosition.valid_from <= date.today(),
                UserPosition.valid_to.is_(None) | (UserPosition.valid_to >= date.today())
            )
        ).first()
        
        position = None
        department = None
        
        if user_position:
            position_obj = db.query(Position).filter(Position.id == user_position.position_id).first()
            if position_obj:
                # Get department for position
                department_obj = db.query(Department).filter(Department.id == position_obj.department_id).first()
                
                position = schemas.PositionOut(
                    id=position_obj.id,
                    department_id=position_obj.department_id,
                    title=position_obj.title,
                    description=position_obj.description,
                    is_active=position_obj.is_active,
                    department=schemas.DepartmentOut(
                        id=department_obj.id,
                        name=department_obj.name,
                        code=department_obj.code
                    ) if department_obj else None
                )
                
                # Set department from position
                if department_obj:
                    department = schemas.DepartmentOut(
                        id=department_obj.id,
                        name=department_obj.name,
                        code=department_obj.code
                    )
        
        result.append(schemas.UserWithRoles(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            roles=roles,
            position=position,
            department=department,
            created_at=user.created_at or datetime.now(),
            updated_at=user.updated_at
        ))
    
    return result

# Get users by role
@router.get("/users/by-role/{role_code}", response_model=List[schemas.UserWithRoles])
def get_users_by_role(role_code: str, db: Session = Depends(get_db)):
    """Get all users with a specific role"""
    role = db.query(Role).filter(Role.code == role_code).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Get users with this role
    user_roles = db.query(UserRole).filter(
        and_(
            UserRole.role_id == role.id,
            UserRole.valid_from <= date.today(),
            UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
        )
    ).all()
    
    result = []
    for user_role in user_roles:
        user = db.query(User).filter(User.id == user_role.user_id).first()
        if user:
            # Get all user roles
            all_user_roles = db.query(UserRole).filter(
                and_(
                    UserRole.user_id == user.id,
                    UserRole.valid_from <= date.today(),
                    UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
                )
            ).all()
            
            roles = []
            for ur in all_user_roles:
                role_obj = db.query(Role).filter(Role.id == ur.role_id).first()
                if role_obj:
                    roles.append(schemas.RoleOut(
                        id=role_obj.id,
                        code=role_obj.code,
                        name=role_obj.name,
                        is_active=True,
                        created_at=role_obj.created_at or datetime.now(),
                        updated_at=role_obj.updated_at
                    ))
            
            # Get user position
            user_position = db.query(UserPosition).filter(
                and_(
                    UserPosition.user_id == user.id,
                    UserPosition.valid_from <= date.today(),
                    UserPosition.valid_to.is_(None) | (UserPosition.valid_to >= date.today())
                )
            ).first()
            
            position = None
            department = None
            
            if user_position:
                position_obj = db.query(Position).filter(Position.id == user_position.position_id).first()
                if position_obj:
                    # Get department for position
                    department_obj = db.query(Department).filter(Department.id == position_obj.department_id).first()
                    
                    position = schemas.PositionOut(
                        id=position_obj.id,
                        department_id=position_obj.department_id,
                        title=position_obj.title,
                        description=position_obj.description,
                        is_active=position_obj.is_active,
                        department=schemas.DepartmentOut(
                            id=department_obj.id,
                            name=department_obj.name,
                            code=department_obj.code
                        ) if department_obj else None
                    )
                    
                    # Set department from position
                    if department_obj:
                        department = schemas.DepartmentOut(
                            id=department_obj.id,
                            name=department_obj.name,
                            code=department_obj.code
                        )
            
            result.append(schemas.UserWithRoles(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                phone=user.phone,
                is_active=user.is_active,
                roles=roles,
                position=position,
                department=department,
                created_at=user.created_at or datetime.now(),
                updated_at=user.updated_at
            ))
    
    return result

# Bulk User Operations
@router.post("/users/bulk-create", response_model=List[schemas.UserWithRoles])
def bulk_create_users(payload: schemas.BulkUserCreate, db: Session = Depends(get_db)):
    """Create multiple users at once"""
    from app.core.security import hash_password
    
    created_users = []
    for user_data in payload.users:
        # Check if user already exists
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            continue  # Skip existing users
        
        # Create user
        user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            phone=user_data.phone,
            password_hash=hash_password(user_data.password),
            is_active=True
        )
        db.add(user)
        db.flush()  # Get the ID
        
        # Assign roles if provided
        if user_data.roles:
            for role_assign in user_data.roles:
                user_role = UserRole(
                    user_id=user.id,
                    role_id=role_assign.role_id,
                    valid_from=role_assign.valid_from,
                    valid_to=role_assign.valid_to,
                    is_primary=role_assign.is_primary
                )
                db.add(user_role)
        
        created_users.append(user)
    
    db.commit()
    
    # Return created users with roles
    result = []
    for user in created_users:
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
            role_obj = db.query(Role).filter(Role.id == user_role.role_id).first()
            if role_obj:
                roles.append(schemas.RoleOut(
                    id=role_obj.id,
                    code=role_obj.code,
                    name=role_obj.name,
                    is_active=True,
                    created_at=role_obj.created_at or datetime.now(),
                    updated_at=role_obj.updated_at
                ))
        
        result.append(schemas.UserWithRoles(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            roles=roles,
            created_at=user.created_at or datetime.now(),
            updated_at=user.updated_at
        ))
    
    return result

@router.put("/users/bulk-update", response_model=List[schemas.UserWithRoles])
def bulk_update_users(payload: schemas.BulkUserUpdate, db: Session = Depends(get_db)):
    """Update multiple users at once"""
    updated_users = []
    
    for user_data in payload.users:
        user = db.query(User).filter(User.id == user_data.id).first()
        if not user:
            continue
        
        # Update fields
        if user_data.full_name is not None:
            user.full_name = user_data.full_name
        if user_data.email is not None:
            user.email = user_data.email
        if user_data.phone is not None:
            user.phone = user_data.phone
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        
        updated_users.append(user)
    
    db.commit()
    
    # Return updated users with roles
    result = []
    for user in updated_users:
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
            role_obj = db.query(Role).filter(Role.id == user_role.role_id).first()
            if role_obj:
                roles.append(schemas.RoleOut(
                    id=role_obj.id,
                    code=role_obj.code,
                    name=role_obj.name,
                    is_active=True,
                    created_at=role_obj.created_at or datetime.now(),
                    updated_at=role_obj.updated_at
                ))
        
        result.append(schemas.UserWithRoles(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            roles=roles,
            created_at=user.created_at or datetime.now(),
            updated_at=user.updated_at
        ))
    
    return result

@router.delete("/users/bulk-delete", status_code=204)
def bulk_delete_users(payload: schemas.BulkUserDelete, db: Session = Depends(get_db)):
    """Delete multiple users at once"""
    try:
        from app.models import UserPosition, Delegation
        
        for user_id in payload.user_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                # Check if user has any payment requests
                payment_requests_count = db.query(PaymentRequest).filter(
                    and_(PaymentRequest.created_by_user_id == user_id, PaymentRequest.deleted == False)
                ).count()
                
                if payment_requests_count > 0:
                    # Instead of deleting, deactivate the user
                    user.is_active = False
                    print(f"Deactivated user: {user.email} ({user_id}) - has {payment_requests_count} payment requests")
                else:
                    # Delete all related records first
                    # Delete user positions
                    db.query(UserPosition).filter(UserPosition.user_id == user_id).delete()
                    
                    # Delete delegations where user is either from_user or to_user
                    db.query(Delegation).filter(
                        (Delegation.from_user_id == user_id) | (Delegation.to_user_id == user_id)
                    ).delete()
                    
                    # Delete user roles
                    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
                    
                    # Finally delete the user
                    db.delete(user)
                    print(f"Deleted user: {user.email} ({user_id})")
            else:
                print(f"User not found: {user_id}")
        
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        print(f"Error deleting users: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting users: {str(e)}")

# Role Statistics
@router.get("/roles/statistics", response_model=schemas.RoleStatistics)
def get_role_statistics(db: Session = Depends(get_db)):
    """Get role usage statistics"""
    total_roles = db.query(Role).count()
    active_roles = db.query(Role).filter(Role.is_active == True).count()
    
    # Get role usage counts
    role_usage = db.query(
        Role.code,
        func.count(UserRole.id).label('user_count')
    ).join(UserRole, Role.id == UserRole.role_id).group_by(Role.code).all()
    
    if role_usage:
        most_used = max(role_usage, key=lambda x: x.user_count)
        least_used = min(role_usage, key=lambda x: x.user_count)
        most_used_role = most_used.code
        least_used_role = least_used.code
    else:
        most_used_role = None
        least_used_role = None
    
    return schemas.RoleStatistics(
        total_roles=total_roles,
        active_roles=active_roles,
        most_used_role=most_used_role,
        least_used_role=least_used_role
    )

@router.get("/roles/{role_id}/usage", response_model=schemas.RoleUsage)
def get_role_usage(role_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get usage statistics for a specific role"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    user_count = db.query(UserRole).filter(UserRole.role_id == role_id).count()
    
    # Get last assignment date
    last_assignment = db.query(UserRole).filter(
        UserRole.role_id == role_id
    ).order_by(desc(UserRole.created_at)).first()
    
    last_assigned = last_assignment.created_at if last_assignment else None
    
    return schemas.RoleUsage(
        role_id=role.id,
        role_name=role.name,
        user_count=user_count,
        last_assigned=last_assigned,
        is_active=role.is_active
    )
