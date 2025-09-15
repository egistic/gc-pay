# app/modules/file_management/router.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.db import get_db
from app.core.file_management import FileManagementService, create_default_file_validation_rules
from app.models import FileValidationRule, RequestFile
from app.core.security import get_current_user
from app.models import User
from pydantic import BaseModel

router = APIRouter(prefix="/file-management", tags=["file-management"])

class FileValidationRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    file_type: str
    allowed_extensions: List[str]
    max_size_mb: int
    mime_types: List[str]
    is_required: bool = False
    is_active: bool = True

class FileValidationRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    file_type: Optional[str] = None
    allowed_extensions: Optional[List[str]] = None
    max_size_mb: Optional[int] = None
    mime_types: Optional[List[str]] = None
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None

@router.post("/upload/{request_id}")
async def upload_file(
    request_id: str,
    file: UploadFile = File(...),
    file_type: str = Query("document", description="Type of file being uploaded"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file for a payment request with enhanced validation.
    
    - **request_id**: ID of the payment request
    - **file**: File to upload
    - **file_type**: Type of file (document, image, archive)
    """
    file_service = FileManagementService(db)
    
    try:
        request_file = file_service.save_file(file, request_id, file_type)
        
        return {
            "file_id": str(request_file.id),
            "filename": request_file.file_name,
            "mime_type": request_file.mime_type,
            "storage_path": request_file.storage_path,
            "file_type": file_type,
            "uploaded_at": request_file.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/files/{request_id}")
async def list_request_files(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all files for a payment request.
    """
    file_service = FileManagementService(db)
    files = file_service.get_files_by_request(request_id)
    
    return {
        "files": [
            {
                "id": str(file.id),
                "filename": file.file_name,
                "mime_type": file.mime_type,
                "storage_path": file.storage_path,
                "created_at": file.created_at
            }
            for file in files
        ],
        "count": len(files)
    }

@router.get("/files/info/{file_id}")
async def get_file_info(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get information about a specific file.
    """
    file_service = FileManagementService(db)
    file_info = file_service.get_file_info(file_id)
    
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "id": str(file_info.id),
        "filename": file_info.file_name,
        "mime_type": file_info.mime_type,
        "storage_path": file_info.storage_path,
        "request_id": str(file_info.request_id),
        "created_at": file_info.created_at
    }

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a file from storage and database.
    """
    file_service = FileManagementService(db)
    success = file_service.delete_file(file_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"message": "File deleted successfully"}

@router.post("/validation-rules")
async def create_validation_rule(
    rule_data: FileValidationRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new file validation rule.
    """
    rule = FileValidationRule(
        name=rule_data.name,
        description=rule_data.description,
        file_type=rule_data.file_type,
        allowed_extensions=rule_data.allowed_extensions,
        max_size_mb=rule_data.max_size_mb,
        mime_types=rule_data.mime_types,
        is_required=rule_data.is_required,
        is_active=rule_data.is_active,
        created_by=current_user.id
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return {
        "id": str(rule.id),
        "name": rule.name,
        "description": rule.description,
        "file_type": rule.file_type,
        "allowed_extensions": rule.allowed_extensions,
        "max_size_mb": rule.max_size_mb,
        "mime_types": rule.mime_types,
        "is_required": rule.is_required,
        "is_active": rule.is_active,
        "created_at": rule.created_at
    }

@router.get("/validation-rules")
async def list_validation_rules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    active_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    List file validation rules.
    
    - **skip**: Number of records to skip
    - **limit**: Maximum number of records to return
    - **file_type**: Filter by file type
    - **active_only**: If true, only return active rules
    """
    query = db.query(FileValidationRule)
    
    if file_type:
        query = query.filter(FileValidationRule.file_type == file_type)
    
    if active_only:
        query = query.filter(FileValidationRule.is_active == True)
    
    rules = query.offset(skip).limit(limit).all()
    
    return {
        "rules": [
            {
                "id": str(rule.id),
                "name": rule.name,
                "description": rule.description,
                "file_type": rule.file_type,
                "allowed_extensions": rule.allowed_extensions,
                "max_size_mb": rule.max_size_mb,
                "mime_types": rule.mime_types,
                "is_required": rule.is_required,
                "is_active": rule.is_active,
                "created_at": rule.created_at,
                "updated_at": rule.updated_at
            }
            for rule in rules
        ],
        "total": query.count(),
        "skip": skip,
        "limit": limit
    }

@router.get("/validation-rules/{rule_id}")
async def get_validation_rule(
    rule_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific validation rule by ID.
    """
    rule = db.query(FileValidationRule).filter(FileValidationRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Validation rule not found")
    
    return {
        "id": str(rule.id),
        "name": rule.name,
        "description": rule.description,
        "file_type": rule.file_type,
        "allowed_extensions": rule.allowed_extensions,
        "max_size_mb": rule.max_size_mb,
        "mime_types": rule.mime_types,
        "is_required": rule.is_required,
        "is_active": rule.is_active,
        "created_at": rule.created_at,
        "updated_at": rule.updated_at
    }

@router.put("/validation-rules/{rule_id}")
async def update_validation_rule(
    rule_id: str,
    rule_data: FileValidationRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a validation rule.
    """
    rule = db.query(FileValidationRule).filter(FileValidationRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Validation rule not found")
    
    # Update fields if provided
    if rule_data.name is not None:
        rule.name = rule_data.name
    if rule_data.description is not None:
        rule.description = rule_data.description
    if rule_data.file_type is not None:
        rule.file_type = rule_data.file_type
    if rule_data.allowed_extensions is not None:
        rule.allowed_extensions = rule_data.allowed_extensions
    if rule_data.max_size_mb is not None:
        rule.max_size_mb = rule_data.max_size_mb
    if rule_data.mime_types is not None:
        rule.mime_types = rule_data.mime_types
    if rule_data.is_required is not None:
        rule.is_required = rule_data.is_required
    if rule_data.is_active is not None:
        rule.is_active = rule_data.is_active
    
    db.commit()
    db.refresh(rule)
    
    return {
        "id": str(rule.id),
        "name": rule.name,
        "description": rule.description,
        "file_type": rule.file_type,
        "allowed_extensions": rule.allowed_extensions,
        "max_size_mb": rule.max_size_mb,
        "mime_types": rule.mime_types,
        "is_required": rule.is_required,
        "is_active": rule.is_active,
        "updated_at": rule.updated_at
    }

@router.delete("/validation-rules/{rule_id}")
async def delete_validation_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a validation rule.
    """
    rule = db.query(FileValidationRule).filter(FileValidationRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Validation rule not found")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Validation rule deleted successfully"}

@router.get("/statistics")
async def get_file_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get file management statistics.
    """
    file_service = FileManagementService(db)
    stats = file_service.get_file_statistics()
    
    return stats

@router.post("/initialize-defaults")
async def initialize_default_validation_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initialize default file validation rules for the system.
    """
    create_default_file_validation_rules(db)
    
    return {"message": "Default file validation rules initialized successfully"}

@router.post("/validate")
async def validate_file(
    file: UploadFile = File(...),
    file_type: str = Query("document", description="Type of file to validate"),
    db: Session = Depends(get_db)
):
    """
    Validate a file without uploading it.
    
    - **file**: File to validate
    - **file_type**: Type of file (document, image, archive)
    """
    file_service = FileManagementService(db)
    is_valid, error = file_service.validate_file(file, file_type)
    
    return {
        "is_valid": is_valid,
        "error": error if not is_valid else None,
        "filename": file.filename,
        "file_type": file_type,
        "size_bytes": file.size,
        "mime_type": file.content_type
    }
