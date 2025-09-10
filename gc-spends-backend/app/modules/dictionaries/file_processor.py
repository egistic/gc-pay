import pandas as pd
import io
from typing import List, Dict, Any, Tuple
from fastapi import UploadFile, HTTPException
import uuid
from datetime import datetime

class FileProcessor:
    """Класс для обработки файлов импорта/экспорта справочников"""
    
    SUPPORTED_FORMATS = ['csv', 'xlsx', 'xls']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @classmethod
    async def validate_file(cls, file: UploadFile) -> Tuple[bool, str]:
        """Валидация загружаемого файла"""
        # Проверка размера файла
        if file.size and file.size > cls.MAX_FILE_SIZE:
            return False, f"Файл слишком большой. Максимальный размер: {cls.MAX_FILE_SIZE / 1024 / 1024:.1f}MB"
        
        # Проверка формата файла
        file_extension = file.filename.split('.')[-1].lower() if file.filename else ''
        if file_extension not in cls.SUPPORTED_FORMATS:
            return False, f"Неподдерживаемый формат файла. Поддерживаемые форматы: {', '.join(cls.SUPPORTED_FORMATS)}"
        
        return True, ""
    
    @classmethod
    async def process_counterparties_file(cls, file: UploadFile) -> Tuple[List[Dict], List[Dict]]:
        """Обработка файла с контрагентами"""
        try:
            # Чтение файла
            content = await file.read()
            
            # Определение формата и чтение данных
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            else:  # Excel файлы
                df = pd.read_excel(io.BytesIO(content))
            
            # Валидация и обработка данных
            processed_items = []
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Очистка и валидация данных
                    item = {
                        'name': str(row.get('name', '')).strip(),
                        'tax_id': str(row.get('tax_id', '')).strip() if pd.notna(row.get('tax_id')) else None,
                        'category': str(row.get('category', '')).strip() if pd.notna(row.get('category')) else None,
                        'is_active': bool(row.get('is_active', True))
                    }
                    
                    # Валидация обязательных полей
                    if not item['name']:
                        errors.append({
                            'row': index + 1,
                            'field': 'name',
                            'message': 'Название контрагента обязательно'
                        })
                        continue
                    
                    # Валидация длины полей
                    if len(item['name']) > 255:
                        errors.append({
                            'row': index + 1,
                            'field': 'name',
                            'message': 'Название контрагента слишком длинное (максимум 255 символов)'
                        })
                        continue
                    
                    if item['tax_id'] and len(item['tax_id']) > 64:
                        errors.append({
                            'row': index + 1,
                            'field': 'tax_id',
                            'message': 'БИН/ИИН слишком длинный (максимум 64 символа)'
                        })
                        continue
                    
                    if item['category'] and len(item['category']) > 128:
                        errors.append({
                            'row': index + 1,
                            'field': 'category',
                            'message': 'Категория слишком длинная (максимум 128 символов)'
                        })
                        continue
                    
                    processed_items.append(item)
                    
                except Exception as e:
                    errors.append({
                        'row': index + 1,
                        'field': 'general',
                        'message': f'Ошибка обработки строки: {str(e)}'
                    })
            
            return processed_items, errors
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Ошибка обработки файла: {str(e)}")
    
    @classmethod
    async def process_expense_articles_file(cls, file: UploadFile) -> Tuple[List[Dict], List[Dict]]:
        """Обработка файла со статьями расходов"""
        try:
            # Чтение файла
            content = await file.read()
            
            # Определение формата и чтение данных
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            else:  # Excel файлы
                df = pd.read_excel(io.BytesIO(content))
            
            # Валидация и обработка данных
            processed_items = []
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Очистка и валидация данных
                    item = {
                        'code': str(row.get('code', '')).strip().upper(),
                        'name': str(row.get('name', '')).strip(),
                        'description': str(row.get('description', '')).strip() if pd.notna(row.get('description')) else None,
                        'is_active': bool(row.get('is_active', True))
                    }
                    
                    # Валидация обязательных полей
                    if not item['code']:
                        errors.append({
                            'row': index + 1,
                            'field': 'code',
                            'message': 'Код статьи расходов обязателен'
                        })
                        continue
                    
                    if not item['name']:
                        errors.append({
                            'row': index + 1,
                            'field': 'name',
                            'message': 'Название статьи расходов обязательно'
                        })
                        continue
                    
                    # Валидация длины полей
                    if len(item['code']) > 64:
                        errors.append({
                            'row': index + 1,
                            'field': 'code',
                            'message': 'Код статьи расходов слишком длинный (максимум 64 символа)'
                        })
                        continue
                    
                    if len(item['name']) > 255:
                        errors.append({
                            'row': index + 1,
                            'field': 'name',
                            'message': 'Название статьи расходов слишком длинное (максимум 255 символов)'
                        })
                        continue
                    
                    if item['description'] and len(item['description']) > 1000:
                        errors.append({
                            'row': index + 1,
                            'field': 'description',
                            'message': 'Описание слишком длинное (максимум 1000 символов)'
                        })
                        continue
                    
                    processed_items.append(item)
                    
                except Exception as e:
                    errors.append({
                        'row': index + 1,
                        'field': 'general',
                        'message': f'Ошибка обработки строки: {str(e)}'
                    })
            
            return processed_items, errors
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Ошибка обработки файла: {str(e)}")
    
    @classmethod
    async def process_vat_rates_file(cls, file: UploadFile) -> Tuple[List[Dict], List[Dict]]:
        """Обработка файла со ставками НДС"""
        try:
            # Чтение файла
            content = await file.read()
            
            # Определение формата и чтение данных
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            else:  # Excel файлы
                df = pd.read_excel(io.BytesIO(content))
            
            # Валидация и обработка данных
            processed_items = []
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Очистка и валидация данных
                    item = {
                        'rate': float(row.get('rate', 0)),
                        'name': str(row.get('name', '')).strip(),
                        'is_active': bool(row.get('is_active', True))
                    }
                    
                    # Валидация обязательных полей
                    if not item['name']:
                        errors.append({
                            'row': index + 1,
                            'field': 'name',
                            'message': 'Название ставки НДС обязательно'
                        })
                        continue
                    
                    # Валидация ставки НДС
                    if item['rate'] < 0 or item['rate'] > 1:
                        errors.append({
                            'row': index + 1,
                            'field': 'rate',
                            'message': 'Ставка НДС должна быть от 0 до 1'
                        })
                        continue
                    
                    # Валидация длины полей
                    if len(item['name']) > 64:
                        errors.append({
                            'row': index + 1,
                            'field': 'name',
                            'message': 'Название ставки НДС слишком длинное (максимум 64 символа)'
                        })
                        continue
                    
                    processed_items.append(item)
                    
                except Exception as e:
                    errors.append({
                        'row': index + 1,
                        'field': 'general',
                        'message': f'Ошибка обработки строки: {str(e)}'
                    })
            
            return processed_items, errors
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Ошибка обработки файла: {str(e)}")
    
    @classmethod
    def export_to_csv(cls, data: List[Dict], filename: str) -> bytes:
        """Экспорт данных в CSV формат"""
        try:
            df = pd.DataFrame(data)
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False, encoding='utf-8')
            return csv_buffer.getvalue().encode('utf-8')
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка экспорта в CSV: {str(e)}")
    
    @classmethod
    def export_to_excel(cls, data: List[Dict], filename: str) -> bytes:
        """Экспорт данных в Excel формат"""
        try:
            df = pd.DataFrame(data)
            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Data')
            return excel_buffer.getvalue()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка экспорта в Excel: {str(e)}")
    
    @classmethod
    def get_import_template(cls, dictionary_type: str) -> Tuple[bytes, str]:
        """Получение шаблона для импорта"""
        templates = {
            'counterparties': {
                'columns': ['name', 'tax_id', 'category', 'is_active'],
                'sample_data': [
                    ['ООО "Поставщик 1"', '123456789012', 'Поставщик СХ', True],
                    ['ИП Иванов И.И.', '870101300234', 'Поставщик Услуг', True],
                    ['АО "Покупатель"', '098765432112', 'Покупатель', False]
                ]
            },
            'expense-articles': {
                'columns': ['code', 'name', 'description', 'is_active'],
                'sample_data': [
                    ['EI001', 'Закупка товаров', 'Закупка товаров для торговли', True],
                    ['EI002', 'Оплата услуг', 'Оплата различных услуг', True],
                    ['EI003', 'Командировочные расходы', 'Расходы на командировки', False]
                ]
            },
            'vat-rates': {
                'columns': ['rate', 'name', 'is_active'],
                'sample_data': [
                    [0.0, '0%', True],
                    [0.12, '12%', True],
                    [0.16, '16%', True],
                    [0.20, '20%', False]
                ]
            }
        }
        
        if dictionary_type not in templates:
            raise HTTPException(status_code=400, detail=f"Неподдерживаемый тип справочника: {dictionary_type}")
        
        template = templates[dictionary_type]
        df = pd.DataFrame(template['sample_data'], columns=template['columns'])
        
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Template')
        
        return excel_buffer.getvalue(), f"{dictionary_type}_template.xlsx"
