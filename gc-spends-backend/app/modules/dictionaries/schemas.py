from pydantic import BaseModel, Field, validator
from typing import List, Optional
import uuid
from datetime import datetime

# Base schemas for input operations
class CounterpartyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Название контрагента")
    tax_id: Optional[str] = Field(None, max_length=64, description="БИН/ИИН")
    category: Optional[str] = Field(None, max_length=128, description="Категория контрагента")
    is_active: bool = Field(True, description="Активность контрагента")

    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Название контрагента не может быть пустым')
        return v.strip()

class CounterpartyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    tax_id: Optional[str] = Field(None, max_length=64)
    category: Optional[str] = Field(None, max_length=128)
    is_active: Optional[bool] = None

    @validator('name')
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Название контрагента не может быть пустым')
        return v.strip() if v else v

class ExpenseArticleCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=64, description="Код статьи расходов")
    name: str = Field(..., min_length=1, max_length=255, description="Название статьи расходов")
    description: Optional[str] = Field(None, max_length=1000, description="Описание статьи")
    is_active: bool = Field(True, description="Активность статьи")

    @validator('code')
    def validate_code(cls, v):
        if not v.strip():
            raise ValueError('Код статьи расходов не может быть пустым')
        return v.strip().upper()

    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Название статьи расходов не может быть пустым')
        return v.strip()

class ExpenseArticleUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=1, max_length=64)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None

    @validator('code')
    def validate_code(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Код статьи расходов не может быть пустым')
        return v.strip().upper() if v else v

    @validator('name')
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Название статьи расходов не может быть пустым')
        return v.strip() if v else v

class VatRateCreate(BaseModel):
    rate: float = Field(..., ge=0, le=1, description="Ставка НДС (от 0 до 1)")
    name: str = Field(..., min_length=1, max_length=64, description="Название ставки")
    is_active: bool = Field(True, description="Активность ставки")

    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Название ставки НДС не может быть пустым')
        return v.strip()

class VatRateUpdate(BaseModel):
    rate: Optional[float] = Field(None, ge=0, le=1)
    name: Optional[str] = Field(None, min_length=1, max_length=64)
    is_active: Optional[bool] = None

    @validator('name')
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Название ставки НДС не может быть пустым')
        return v.strip() if v else v

# Output schemas (already defined in router.py, but let's organize them here)
class CounterpartyOut(BaseModel):
    id: uuid.UUID
    name: str
    tax_id: Optional[str] = None
    category: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class CurrencyOut(BaseModel):
    code: str
    scale: int

    class Config:
        from_attributes = True

class VatRateOut(BaseModel):
    id: uuid.UUID
    rate: float
    name: str
    is_active: bool

    class Config:
        from_attributes = True

class ExpenseArticleOut(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# Bulk operation schemas
class BulkCreateRequest(BaseModel):
    items: List[dict] = Field(..., min_items=1, max_items=1000, description="Список элементов для создания")

class BulkUpdateRequest(BaseModel):
    updates: List[dict] = Field(..., min_items=1, max_items=1000, description="Список обновлений")

class BulkDeleteRequest(BaseModel):
    ids: List[uuid.UUID] = Field(..., min_items=1, max_items=1000, description="Список ID для удаления")

# Import/Export schemas
class ImportRequest(BaseModel):
    dictionary_type: str = Field(..., description="Тип справочника")
    file_format: str = Field(..., description="Формат файла (csv, excel)")
    options: Optional[dict] = Field(None, description="Дополнительные опции импорта")

class ExportRequest(BaseModel):
    dictionary_type: str = Field(..., description="Тип справочника")
    file_format: str = Field(..., description="Формат файла (csv, excel)")
    filters: Optional[dict] = Field(None, description="Фильтры для экспорта")

# Response schemas
class BulkOperationResponse(BaseModel):
    success_count: int
    error_count: int
    errors: List[dict] = []
    created_items: List[dict] = []
    updated_items: List[dict] = []

class ImportResponse(BaseModel):
    success: bool
    imported_count: int
    error_count: int
    errors: List[dict] = []
    warnings: List[dict] = []

# Error schemas
class ValidationError(BaseModel):
    field: str
    message: str
    value: Optional[str] = None

class BulkError(BaseModel):
    index: int
    item: dict
    errors: List[ValidationError]
