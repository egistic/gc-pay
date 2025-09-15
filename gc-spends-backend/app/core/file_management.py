# app/core/file_management.py
import os
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from app.models import FileValidationRule, RequestFile, PaymentRequest
from app.core.config import settings

class FileManagementService:
    """
    Service for enhanced file management with validation and naming standards.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.base_storage_path = getattr(settings, 'FILE_STORAGE_PATH', '/tmp/uploads')
        self.max_file_size_mb = getattr(settings, 'MAX_FILE_SIZE_MB', 50)
    
    def validate_file(self, file: UploadFile, file_type: str = "document") -> Tuple[bool, str]:
        """
        Validate uploaded file against rules.
        
        Returns:
            tuple: (is_valid, error_message)
        """
        # Get validation rules for file type
        rules = self.db.query(FileValidationRule).filter(
            FileValidationRule.file_type == file_type,
            FileValidationRule.is_active == True
        ).all()
        
        if not rules:
            # Use default validation if no rules found
            return self._default_validation(file)
        
        # Apply all active rules
        for rule in rules:
            is_valid, error = self._validate_against_rule(file, rule)
            if not is_valid:
                return False, error
        
        return True, ""
    
    def _validate_against_rule(self, file: UploadFile, rule: FileValidationRule) -> Tuple[bool, str]:
        """
        Validate file against a specific rule.
        """
        # Check file extension
        if rule.allowed_extensions:
            file_ext = Path(file.filename).suffix.lower()
            if file_ext not in rule.allowed_extensions:
                return False, f"File extension {file_ext} not allowed. Allowed: {', '.join(rule.allowed_extensions)}"
        
        # Check file size
        if rule.max_size_mb:
            file_size_mb = file.size / (1024 * 1024) if file.size else 0
            if file_size_mb > rule.max_size_mb:
                return False, f"File size {file_size_mb:.2f}MB exceeds maximum {rule.max_size_mb}MB"
        
        # Check MIME type
        if rule.mime_types:
            if file.content_type not in rule.mime_types:
                return False, f"MIME type {file.content_type} not allowed. Allowed: {', '.join(rule.mime_types)}"
        
        return True, ""
    
    def _default_validation(self, file: UploadFile) -> Tuple[bool, str]:
        """
        Default file validation when no rules are configured.
        """
        # Check file size
        if file.size and file.size > (self.max_file_size_mb * 1024 * 1024):
            return False, f"File size exceeds maximum {self.max_file_size_mb}MB"
        
        # Check filename format
        if not self._is_valid_filename(file.filename):
            return False, "Invalid filename format. Only alphanumeric characters, dots, hyphens, and underscores are allowed."
        
        return True, ""
    
    def _is_valid_filename(self, filename: str) -> bool:
        """
        Check if filename follows naming standards.
        """
        if not filename:
            return False
        
        # Allow alphanumeric, dots, hyphens, underscores (no spaces to match DB constraint)
        pattern = r'^[a-zA-Z0-9._-]+$'
        return bool(re.match(pattern, filename))
    
    def generate_standard_filename(self, original_filename: str, request_id: str, file_type: str = "document") -> str:
        """
        Generate a standardized filename following naming conventions.
        
        Format: {request_id}_{file_type}_{timestamp}_{sanitized_original_name}
        """
        # Sanitize original filename
        sanitized_name = self._sanitize_filename(original_filename)
        
        # Get file extension
        file_ext = Path(original_filename).suffix.lower()
        
        # Generate timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Generate unique identifier
        unique_id = str(uuid.uuid4())[:8]
        
        # Create standard filename
        standard_name = f"{request_id}_{file_type}_{timestamp}_{unique_id}{file_ext}"
        
        return standard_name
    
    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename by removing/replacing invalid characters.
        Handles Cyrillic and other non-ASCII characters by transliterating them.
        """
        if not filename:
            return "file"
        
        # Remove extension for processing
        name_without_ext = Path(filename).stem
        
        # Transliterate Cyrillic characters to Latin equivalents
        cyrillic_to_latin = {
            'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
            'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
            'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
            'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
            'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        }
        
        # Apply transliteration
        transliterated = name_without_ext
        for cyrillic, latin in cyrillic_to_latin.items():
            transliterated = transliterated.replace(cyrillic, latin)
        
        # Replace any remaining invalid characters with underscores
        # Only allow alphanumeric, dots, hyphens, underscores
        sanitized = re.sub(r'[^a-zA-Z0-9._-]', '_', transliterated)
        
        # Remove multiple consecutive underscores
        sanitized = re.sub(r'_+', '_', sanitized)
        
        # Remove leading/trailing underscores
        sanitized = sanitized.strip('_')
        
        # Ensure it's not empty
        if not sanitized:
            sanitized = "file"
        
        return sanitized
    
    def get_storage_path(self, request_id: str, file_type: str = "document") -> str:
        """
        Get storage path for file based on request ID and type.
        
        Structure: /base_path/{year}/{month}/{request_id}/{file_type}/
        """
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        
        path = os.path.join(
            self.base_storage_path,
            year,
            month,
            str(request_id),
            file_type
        )
        
        # Create directory if it doesn't exist
        os.makedirs(path, exist_ok=True)
        
        return path
    
    def save_file(self, file: UploadFile, request_id: str, file_type: str = "document") -> RequestFile:
        """
        Save uploaded file with standard naming and validation.
        """
        # Validate file
        is_valid, error = self.validate_file(file, file_type)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"File validation failed: {error}")
        
        # Generate standard filename
        standard_filename = self.generate_standard_filename(file.filename, request_id, file_type)
        
        # Get storage path
        storage_path = self.get_storage_path(request_id, file_type)
        full_path = os.path.join(storage_path, standard_filename)
        
        # Save file
        with open(full_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
        
        # Create database record
        request_file = RequestFile(
            request_id=request_id,
            file_name=standard_filename,
            mime_type=file.content_type or "application/octet-stream",
            storage_path=full_path
        )
        
        self.db.add(request_file)
        self.db.commit()
        self.db.refresh(request_file)
        
        return request_file
    
    def get_file_info(self, file_id: str) -> Optional[RequestFile]:
        """
        Get file information by ID.
        """
        return self.db.query(RequestFile).filter(RequestFile.id == file_id).first()
    
    def delete_file(self, file_id: str) -> bool:
        """
        Delete file from storage and database.
        """
        file_record = self.get_file_info(file_id)
        if not file_record:
            return False
        
        # Delete physical file
        try:
            if os.path.exists(file_record.storage_path):
                os.remove(file_record.storage_path)
        except OSError:
            pass  # File might already be deleted
        
        # Delete database record
        self.db.delete(file_record)
        self.db.commit()
        
        return True
    
    def get_files_by_request(self, request_id: str) -> List[RequestFile]:
        """
        Get all files for a payment request.
        """
        return self.db.query(RequestFile).filter(RequestFile.request_id == request_id).all()
    
    def get_file_statistics(self) -> Dict[str, Any]:
        """
        Get file management statistics.
        """
        total_files = self.db.query(RequestFile).count()
        
        # Group by MIME type
        mime_types = {}
        files = self.db.query(RequestFile).all()
        
        for file in files:
            mime_type = file.mime_type or "unknown"
            mime_types[mime_type] = mime_types.get(mime_type, 0) + 1
        
        # Calculate total storage used
        total_size = 0
        for file in files:
            try:
                if os.path.exists(file.storage_path):
                    total_size += os.path.getsize(file.storage_path)
            except OSError:
                pass
        
        return {
            "total_files": total_files,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "mime_types": mime_types
        }
    
    def cleanup_orphaned_files(self) -> int:
        """
        Clean up files that don't have corresponding database records.
        """
        # This would require scanning the file system and comparing with database
        # Implementation depends on specific requirements
        return 0

def sanitize_filename(filename: str) -> str:
    """
    Utility function to sanitize filenames for database storage.
    Handles Cyrillic and other non-ASCII characters by transliterating them.
    """
    if not filename:
        return "file"
    
    # Remove extension for processing
    name_without_ext = Path(filename).stem
    file_ext = Path(filename).suffix
    
    # Transliterate Cyrillic characters to Latin equivalents
    cyrillic_to_latin = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    }
    
    # Apply transliteration
    transliterated = name_without_ext
    for cyrillic, latin in cyrillic_to_latin.items():
        transliterated = transliterated.replace(cyrillic, latin)
    
    # Replace any remaining invalid characters with underscores
    # Only allow alphanumeric, dots, hyphens, underscores
    sanitized = re.sub(r'[^a-zA-Z0-9._-]', '_', transliterated)
    
    # Remove multiple consecutive underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    
    # Remove leading/trailing underscores
    sanitized = sanitized.strip('_')
    
    # Ensure it's not empty
    if not sanitized:
        sanitized = "file"
    
    return sanitized + file_ext

def create_default_file_validation_rules(db: Session) -> None:
    """
    Create default file validation rules.
    """
    default_rules = [
        {
            "name": "Document Files",
            "description": "Validation rules for document files",
            "file_type": "document",
            "allowed_extensions": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"],
            "max_size_mb": 10,
            "mime_types": [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain"
            ]
        },
        {
            "name": "Image Files",
            "description": "Validation rules for image files",
            "file_type": "image",
            "allowed_extensions": [".jpg", ".jpeg", ".png", ".gif", ".bmp"],
            "max_size_mb": 5,
            "mime_types": [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/bmp"
            ]
        },
        {
            "name": "Archive Files",
            "description": "Validation rules for archive files",
            "file_type": "archive",
            "allowed_extensions": [".zip", ".rar", ".7z"],
            "max_size_mb": 50,
            "mime_types": [
                "application/zip",
                "application/x-rar-compressed",
                "application/x-7z-compressed"
            ]
        }
    ]
    
    # Create rules if they don't exist
    for rule_data in default_rules:
        existing_rule = db.query(FileValidationRule).filter(
            FileValidationRule.name == rule_data["name"]
        ).first()
        
        if not existing_rule:
            rule = FileValidationRule(
                name=rule_data["name"],
                description=rule_data["description"],
                file_type=rule_data["file_type"],
                allowed_extensions=rule_data["allowed_extensions"],
                max_size_mb=rule_data["max_size_mb"],
                mime_types=rule_data["mime_types"],
                created_by=db.query().first().id if db.query().first() else None
            )
            db.add(rule)
    
    db.commit()
