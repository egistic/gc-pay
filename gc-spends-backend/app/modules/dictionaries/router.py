from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.core.db import get_db
from app.models import Counterparty, Currency, VatRate, ExpenseArticle
from .schemas import (
    CounterpartyOut, CurrencyOut, VatRateOut, ExpenseArticleOut,
    CounterpartyCreate, CounterpartyUpdate,
    ExpenseArticleCreate, ExpenseArticleUpdate,
    VatRateCreate, VatRateUpdate,
    BulkCreateRequest, BulkUpdateRequest, BulkDeleteRequest,
    BulkOperationResponse, ImportResponse
)
from .file_processor import FileProcessor
import uuid
from typing import List, Optional
import json

router = APIRouter(prefix="/dictionaries", tags=["dictionaries"])

# ============================================================================
# COUNTERPARTIES ENDPOINTS
# ============================================================================

@router.get("/counterparties/statistics")
async def get_counterparties_statistics(db: Session = Depends(get_db)):
    """Получение статистики по контрагентам"""
    from datetime import datetime, timedelta
    
    total_items = db.query(Counterparty).count()
    active_items = db.query(Counterparty).filter(Counterparty.is_active == True).count()
    inactive_items = total_items - active_items
    
    # Недавно обновленные (за последние 7 дней)
    week_ago = datetime.now() - timedelta(days=7)
    recently_updated = db.query(Counterparty).filter(
        Counterparty.updated_at >= week_ago
    ).count()
    
    return {
        "totalItems": total_items,
        "activeItems": active_items,
        "inactiveItems": inactive_items,
        "recentlyUpdated": recently_updated
    }

@router.get("/counterparties", response_model=List[CounterpartyOut])
def get_counterparties(
    active_only: bool = True,
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка контрагентов с возможностью фильтрации"""
    query = db.query(Counterparty)
    
    if active_only:
        query = query.filter(Counterparty.is_active == True)
    
    if search:
        query = query.filter(
            or_(
                Counterparty.name.ilike(f"%{search}%"),
                Counterparty.tax_id.ilike(f"%{search}%")
            )
        )
    
    if category:
        query = query.filter(Counterparty.category == category)
    
    counterparties = query.order_by(Counterparty.name).all()
    return [CounterpartyOut.model_validate(cp.__dict__) for cp in counterparties]

@router.get("/counterparties/{counterparty_id}", response_model=CounterpartyOut)
def get_counterparty(counterparty_id: uuid.UUID, db: Session = Depends(get_db)):
    """Получение контрагента по ID"""
    counterparty = db.query(Counterparty).filter(Counterparty.id == counterparty_id).first()
    if not counterparty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контрагент не найден")
    return CounterpartyOut.model_validate(counterparty.__dict__)

@router.post("/counterparties", response_model=CounterpartyOut, status_code=201)
def create_counterparty(counterparty: CounterpartyCreate, db: Session = Depends(get_db)):
    """Создание нового контрагента"""
    # Проверка на дубликат по названию
    existing = db.query(Counterparty).filter(Counterparty.name == counterparty.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Контрагент с таким названием уже существует"
        )
    
    # Проверка на дубликат по БИН/ИИН (если указан)
    if counterparty.tax_id:
        existing_tax = db.query(Counterparty).filter(Counterparty.tax_id == counterparty.tax_id).first()
        if existing_tax:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="Контрагент с таким БИН/ИИН уже существует"
            )
    
    new_counterparty = Counterparty(**counterparty.dict())
    db.add(new_counterparty)
    db.commit()
    db.refresh(new_counterparty)
    return CounterpartyOut.model_validate(new_counterparty.__dict__)

@router.put("/counterparties/{counterparty_id}", response_model=CounterpartyOut)
def update_counterparty(
    counterparty_id: uuid.UUID, 
    counterparty_update: CounterpartyUpdate, 
    db: Session = Depends(get_db)
):
    """Обновление контрагента"""
    counterparty = db.query(Counterparty).filter(Counterparty.id == counterparty_id).first()
    if not counterparty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контрагент не найден")
    
    # Проверка на дубликат по названию (если изменяется)
    if counterparty_update.name and counterparty_update.name != counterparty.name:
        existing = db.query(Counterparty).filter(
            and_(Counterparty.name == counterparty_update.name, Counterparty.id != counterparty_id)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="Контрагент с таким названием уже существует"
            )
    
    # Проверка на дубликат по БИН/ИИН (если изменяется)
    if counterparty_update.tax_id and counterparty_update.tax_id != counterparty.tax_id:
        existing_tax = db.query(Counterparty).filter(
            and_(Counterparty.tax_id == counterparty_update.tax_id, Counterparty.id != counterparty_id)
        ).first()
        if existing_tax:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="Контрагент с таким БИН/ИИН уже существует"
            )
    
    # Обновление полей
    update_data = counterparty_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(counterparty, field, value)
    
    db.commit()
    db.refresh(counterparty)
    return CounterpartyOut.model_validate(counterparty.__dict__)

@router.delete("/counterparties/{counterparty_id}")
def delete_counterparty(counterparty_id: uuid.UUID, db: Session = Depends(get_db)):
    """Удаление контрагента"""
    counterparty = db.query(Counterparty).filter(Counterparty.id == counterparty_id).first()
    if not counterparty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контрагент не найден")
    
    db.delete(counterparty)
    db.commit()
    return {"message": "Контрагент успешно удален"}

@router.post("/counterparties/bulk", response_model=BulkOperationResponse)
def bulk_create_counterparties(request: BulkCreateRequest, db: Session = Depends(get_db)):
    """Массовое создание контрагентов"""
    success_count = 0
    error_count = 0
    errors = []
    created_items = []
    
    for index, item_data in enumerate(request.items):
        try:
            # Валидация данных
            counterparty_data = CounterpartyCreate(**item_data)
            
            # Проверка на дубликат
            existing = db.query(Counterparty).filter(Counterparty.name == counterparty_data.name).first()
            if existing:
                errors.append({
                    "index": index,
                    "item": item_data,
                    "error": "Контрагент с таким названием уже существует"
                })
                error_count += 1
                continue
            
            # Создание контрагента
            new_counterparty = Counterparty(**counterparty_data.dict())
            db.add(new_counterparty)
            db.commit()
            db.refresh(new_counterparty)
            
            created_items.append(CounterpartyOut.model_validate(new_counterparty.__dict__).dict())
            success_count += 1
            
        except Exception as e:
            errors.append({
                "index": index,
                "item": item_data,
                "error": str(e)
            })
            error_count += 1
    
    return BulkOperationResponse(
        success_count=success_count,
        error_count=error_count,
        errors=errors,
        created_items=created_items
    )

# ============================================================================
# EXPENSE ARTICLES ENDPOINTS
# ============================================================================

@router.get("/expense-articles/statistics")
async def get_expense_articles_statistics(db: Session = Depends(get_db)):
    """Получение статистики по статьям расходов"""
    from datetime import datetime, timedelta
    
    total_items = db.query(ExpenseArticle).count()
    active_items = db.query(ExpenseArticle).filter(ExpenseArticle.is_active == True).count()
    inactive_items = total_items - active_items
    
    # Недавно обновленные (за последние 7 дней)
    week_ago = datetime.now() - timedelta(days=7)
    recently_updated = db.query(ExpenseArticle).filter(
        ExpenseArticle.updated_at >= week_ago
    ).count()
    
    return {
        "totalItems": total_items,
        "activeItems": active_items,
        "inactiveItems": inactive_items,
        "recentlyUpdated": recently_updated
    }

@router.get("/expense-articles", response_model=List[ExpenseArticleOut])
def get_expense_articles(
    active_only: bool = True,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка статей расходов с возможностью фильтрации"""
    query = db.query(ExpenseArticle)
    
    if active_only:
        query = query.filter(ExpenseArticle.is_active == True)
    
    if search:
        query = query.filter(
            or_(
                ExpenseArticle.name.ilike(f"%{search}%"),
                ExpenseArticle.code.ilike(f"%{search}%")
            )
        )
    
    articles = query.order_by(ExpenseArticle.name).all()
    return [ExpenseArticleOut.model_validate(art.__dict__) for art in articles]

@router.get("/expense-articles/{article_id}", response_model=ExpenseArticleOut)
def get_expense_article(article_id: uuid.UUID, db: Session = Depends(get_db)):
    """Получение статьи расходов по ID"""
    article = db.query(ExpenseArticle).filter(ExpenseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья расходов не найдена")
    return ExpenseArticleOut.model_validate(article.__dict__)

@router.post("/expense-articles", response_model=ExpenseArticleOut, status_code=201)
def create_expense_article(article: ExpenseArticleCreate, db: Session = Depends(get_db)):
    """Создание новой статьи расходов"""
    # Проверка на дубликат по коду
    existing = db.query(ExpenseArticle).filter(ExpenseArticle.code == article.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Статья расходов с таким кодом уже существует"
        )
    
    new_article = ExpenseArticle(**article.dict())
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    return ExpenseArticleOut.model_validate(new_article.__dict__)

@router.put("/expense-articles/{article_id}", response_model=ExpenseArticleOut)
def update_expense_article(
    article_id: uuid.UUID, 
    article_update: ExpenseArticleUpdate, 
    db: Session = Depends(get_db)
):
    """Обновление статьи расходов"""
    article = db.query(ExpenseArticle).filter(ExpenseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья расходов не найдена")
    
    # Проверка на дубликат по коду (если изменяется)
    if article_update.code and article_update.code != article.code:
        existing = db.query(ExpenseArticle).filter(
            and_(ExpenseArticle.code == article_update.code, ExpenseArticle.id != article_id)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="Статья расходов с таким кодом уже существует"
            )
    
    # Обновление полей
    update_data = article_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(article, field, value)
    
    db.commit()
    db.refresh(article)
    return ExpenseArticleOut.model_validate(article.__dict__)

@router.delete("/expense-articles/{article_id}")
def delete_expense_article(article_id: uuid.UUID, db: Session = Depends(get_db)):
    """Удаление статьи расходов"""
    article = db.query(ExpenseArticle).filter(ExpenseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья расходов не найдена")
    
    db.delete(article)
    db.commit()
    return {"message": "Статья расходов успешно удалена"}

@router.post("/expense-articles/bulk", response_model=BulkOperationResponse)
def bulk_create_expense_articles(request: BulkCreateRequest, db: Session = Depends(get_db)):
    """Массовое создание статей расходов"""
    success_count = 0
    error_count = 0
    errors = []
    created_items = []
    
    for index, item_data in enumerate(request.items):
        try:
            # Валидация данных
            article_data = ExpenseArticleCreate(**item_data)
            
            # Проверка на дубликат
            existing = db.query(ExpenseArticle).filter(ExpenseArticle.code == article_data.code).first()
            if existing:
                errors.append({
                    "index": index,
                    "item": item_data,
                    "error": "Статья расходов с таким кодом уже существует"
                })
                error_count += 1
                continue
            
            # Создание статьи расходов
            new_article = ExpenseArticle(**article_data.dict())
            db.add(new_article)
            db.commit()
            db.refresh(new_article)
            
            created_items.append(ExpenseArticleOut.model_validate(new_article.__dict__).dict())
            success_count += 1
            
        except Exception as e:
            errors.append({
                "index": index,
                "item": item_data,
                "error": str(e)
            })
            error_count += 1
    
    return BulkOperationResponse(
        success_count=success_count,
        error_count=error_count,
        errors=errors,
        created_items=created_items
    )

# ============================================================================
# VAT RATES ENDPOINTS
# ============================================================================

@router.get("/vat-rates/statistics")
async def get_vat_rates_statistics(db: Session = Depends(get_db)):
    """Получение статистики по ставкам НДС"""
    from datetime import datetime, timedelta
    
    total_items = db.query(VatRate).count()
    active_items = db.query(VatRate).filter(VatRate.is_active == True).count()
    inactive_items = total_items - active_items
    
    # Недавно обновленные (за последние 7 дней)
    week_ago = datetime.now() - timedelta(days=7)
    recently_updated = db.query(VatRate).filter(
        VatRate.updated_at >= week_ago
    ).count()
    
    return {
        "totalItems": total_items,
        "activeItems": active_items,
        "inactiveItems": inactive_items,
        "recentlyUpdated": recently_updated
    }

@router.get("/vat-rates", response_model=List[VatRateOut])
def get_vat_rates(
    active_only: bool = True,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка ставок НДС с возможностью фильтрации"""
    query = db.query(VatRate)
    
    if active_only:
        query = query.filter(VatRate.is_active == True)
    
    if search:
        query = query.filter(VatRate.name.ilike(f"%{search}%"))
    
    vat_rates = query.order_by(VatRate.rate).all()
    return [VatRateOut.model_validate(vr.__dict__) for vr in vat_rates]

@router.get("/vat-rates/{vat_rate_id}", response_model=VatRateOut)
def get_vat_rate(vat_rate_id: uuid.UUID, db: Session = Depends(get_db)):
    """Получение ставки НДС по ID"""
    vat_rate = db.query(VatRate).filter(VatRate.id == vat_rate_id).first()
    if not vat_rate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ставка НДС не найдена")
    return VatRateOut.model_validate(vat_rate.__dict__)

@router.post("/vat-rates", response_model=VatRateOut, status_code=201)
def create_vat_rate(vat_rate: VatRateCreate, db: Session = Depends(get_db)):
    """Создание новой ставки НДС"""
    # Проверка на дубликат по ставке
    existing = db.query(VatRate).filter(VatRate.rate == vat_rate.rate).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Ставка НДС с таким значением уже существует"
        )
    
    new_vat_rate = VatRate(**vat_rate.dict())
    db.add(new_vat_rate)
    db.commit()
    db.refresh(new_vat_rate)
    return VatRateOut.model_validate(new_vat_rate.__dict__)

@router.put("/vat-rates/{vat_rate_id}", response_model=VatRateOut)
def update_vat_rate(
    vat_rate_id: uuid.UUID, 
    vat_rate_update: VatRateUpdate, 
    db: Session = Depends(get_db)
):
    """Обновление ставки НДС"""
    vat_rate = db.query(VatRate).filter(VatRate.id == vat_rate_id).first()
    if not vat_rate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ставка НДС не найдена")
    
    # Проверка на дубликат по ставке (если изменяется)
    if vat_rate_update.rate is not None and vat_rate_update.rate != vat_rate.rate:
        existing = db.query(VatRate).filter(
            and_(VatRate.rate == vat_rate_update.rate, VatRate.id != vat_rate_id)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="Ставка НДС с таким значением уже существует"
            )
    
    # Обновление полей
    update_data = vat_rate_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vat_rate, field, value)
    
    db.commit()
    db.refresh(vat_rate)
    return VatRateOut.model_validate(vat_rate.__dict__)

@router.delete("/vat-rates/{vat_rate_id}")
def delete_vat_rate(vat_rate_id: uuid.UUID, db: Session = Depends(get_db)):
    """Удаление ставки НДС"""
    vat_rate = db.query(VatRate).filter(VatRate.id == vat_rate_id).first()
    if not vat_rate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ставка НДС не найдена")
    
    db.delete(vat_rate)
    db.commit()
    return {"message": "Ставка НДС успешно удалена"}

# ============================================================================
# CURRENCIES ENDPOINTS (Read-only for now)
# ============================================================================

@router.get("/currencies", response_model=List[CurrencyOut])
def get_currencies(db: Session = Depends(get_db)):
    """Получение списка валют"""
    currencies = db.query(Currency).order_by(Currency.code).all()
    return [CurrencyOut.model_validate(curr.__dict__) for curr in currencies]

@router.get("/currencies/{currency_code}", response_model=CurrencyOut)
def get_currency(currency_code: str, db: Session = Depends(get_db)):
    """Получение валюты по коду"""
    currency = db.query(Currency).filter(Currency.code == currency_code).first()
    if not currency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Валюта не найдена")
    return CurrencyOut.model_validate(currency.__dict__)

# ============================================================================
# PRIORITIES ENDPOINT (Static data)
# ============================================================================

@router.get("/priorities")
def get_priorities():
    """Получение списка приоритетов"""
    return [
        {"id": "high", "name": "Высокий", "rank": 1, "color": "#ef4444"},
        {"id": "medium", "name": "Средний", "rank": 2, "color": "#f59e0b"},
        {"id": "low", "name": "Низкий", "rank": 3, "color": "#10b981"}
    ]

# ============================================================================
# FILE IMPORT/EXPORT ENDPOINTS
# ============================================================================

@router.post("/import", response_model=ImportResponse)
async def import_dictionary_data(
    dictionary_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Импорт данных справочника из файла"""
    # Валидация файла
    is_valid, error_message = await FileProcessor.validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
    
    # Обработка файла в зависимости от типа справочника
    if dictionary_type == "counterparties":
        processed_items, errors = await FileProcessor.process_counterparties_file(file)
        
        # Создание записей в базе данных
        success_count = 0
        for item in processed_items:
            try:
                # Проверка на дубликат
                existing = db.query(Counterparty).filter(Counterparty.name == item['name']).first()
                if existing:
                    errors.append({
                        "item": item,
                        "error": "Контрагент с таким названием уже существует"
                    })
                    continue
                
                new_counterparty = Counterparty(**item)
                db.add(new_counterparty)
                success_count += 1
            except Exception as e:
                errors.append({
                    "item": item,
                    "error": str(e)
                })
        
        db.commit()
        
    elif dictionary_type == "expense-articles":
        processed_items, errors = await FileProcessor.process_expense_articles_file(file)
        
        # Создание записей в базе данных
        success_count = 0
        for item in processed_items:
            try:
                # Проверка на дубликат
                existing = db.query(ExpenseArticle).filter(ExpenseArticle.code == item['code']).first()
                if existing:
                    errors.append({
                        "item": item,
                        "error": "Статья расходов с таким кодом уже существует"
                    })
                    continue
                
                new_article = ExpenseArticle(**item)
                db.add(new_article)
                success_count += 1
            except Exception as e:
                errors.append({
                    "item": item,
                    "error": str(e)
                })
        
        db.commit()
        
    elif dictionary_type == "vat-rates":
        processed_items, errors = await FileProcessor.process_vat_rates_file(file)
        
        # Создание записей в базе данных
        success_count = 0
        for item in processed_items:
            try:
                # Проверка на дубликат
                existing = db.query(VatRate).filter(VatRate.rate == item['rate']).first()
                if existing:
                    errors.append({
                        "item": item,
                        "error": "Ставка НДС с таким значением уже существует"
                    })
                    continue
                
                new_vat_rate = VatRate(**item)
                db.add(new_vat_rate)
                success_count += 1
            except Exception as e:
                errors.append({
                    "item": item,
                    "error": str(e)
                })
        
        db.commit()
        
    else:
        raise HTTPException(status_code=400, detail=f"Неподдерживаемый тип справочника: {dictionary_type}")
    
    return ImportResponse(
        success=success_count > 0,
        imported_count=success_count,
        error_count=len(errors),
        errors=errors
    )

@router.get("/export/{dictionary_type}")
async def export_dictionary_data(
    dictionary_type: str,
    file_format: str = "csv",
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Экспорт данных справочника в файл"""
    if dictionary_type == "counterparties":
        query = db.query(Counterparty)
        if active_only:
            query = query.filter(Counterparty.is_active == True)
        items = query.order_by(Counterparty.name).all()
        data = [CounterpartyOut.model_validate(item.__dict__).dict() for item in items]
        filename = "counterparties"
        
    elif dictionary_type == "expense-articles":
        query = db.query(ExpenseArticle)
        if active_only:
            query = query.filter(ExpenseArticle.is_active == True)
        items = query.order_by(ExpenseArticle.name).all()
        data = [ExpenseArticleOut.model_validate(item.__dict__).dict() for item in items]
        filename = "expense_articles"
        
    elif dictionary_type == "vat-rates":
        query = db.query(VatRate)
        if active_only:
            query = query.filter(VatRate.is_active == True)
        items = query.order_by(VatRate.rate).all()
        data = [VatRateOut.model_validate(item.__dict__).dict() for item in items]
        filename = "vat_rates"
        
    else:
        raise HTTPException(status_code=400, detail=f"Неподдерживаемый тип справочника: {dictionary_type}")
    
    # Генерация файла
    if file_format.lower() == "csv":
        file_content = FileProcessor.export_to_csv(data, filename)
        media_type = "text/csv"
        file_extension = "csv"
    elif file_format.lower() in ["xlsx", "excel"]:
        file_content = FileProcessor.export_to_excel(data, filename)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        file_extension = "xlsx"
    else:
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат файла")
    
    from fastapi.responses import Response
    return Response(
        content=file_content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}.{file_extension}"}
    )

@router.get("/template/{dictionary_type}")
async def get_import_template(dictionary_type: str):
    """Получение шаблона для импорта"""
    try:
        file_content, filename = FileProcessor.get_import_template(dictionary_type)
        
        from fastapi.responses import Response
        return Response(
            content=file_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
