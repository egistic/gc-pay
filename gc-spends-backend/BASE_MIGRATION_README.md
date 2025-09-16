# Базовая Alembic миграция для пустой базы данных

## Описание

Создана базовая Alembic миграция `18fb4e44fc7f_initialize_empty_database_schema.py`, которая инициализирует абсолютно пустую базу данных со всеми необходимыми таблицами и ENUM типами.

## Структура миграций

```
18fb4e44fc7f (base) → c144dd067aa7 → 6c7ca75a1298 (head)
```

- **18fb4e44fc7f** - Базовая миграция (создает все таблицы и ENUMы)
- **c144dd067aa7** - Обновление ENUM типов и колонок
- **6c7ca75a1298** - Исправление колонки статуса distributor_requests

## Что создает базовая миграция

### ENUM типы (7 штук):
- `contract_type` - general, export, service, supply
- `distribution_status` - pending, in_progress, completed, failed
- `document_status` - required, uploaded, verified, rejected
- `payment_priority` - low, normal, high, urgent, critical
- `payment_request_status` - draft, submitted, classified, returned, approved, approved-on-behalf, to-pay, in-register, approved-for-payment, paid-full, paid-partial, rejected, cancelled, closed, distributed, report_published, export_linked, splited
- `role_code` - admin, executor, registrar, sub_registrar, distributor, treasurer
- `sub_registrar_assignment_status` - assigned, in_progress, completed, rejected

### Таблицы (25+ штук):
- `users` - пользователи
- `roles` - роли
- `departments` - департаменты
- `positions` - должности
- `user_roles` - связи пользователей и ролей
- `user_positions` - связи пользователей и должностей
- `delegations` - делегирования
- `counterparties` - контрагенты
- `currencies` - валюты
- `vat_rates` - ставки НДС
- `exchange_rates` - курсы валют
- `expense_articles` - статьи расходов
- `article_required_docs` - обязательные документы для статей
- `responsibilities` - ответственности
- `expense_article_role_assignments` - назначения ролей на статьи
- `payment_requests` - платежные запросы
- `payment_request_lines` - строки платежных запросов
- `line_required_docs` - обязательные документы для строк
- `line_contracts` - договоры для строк
- `request_files` - файлы запросов
- `request_events` - события запросов
- `expense_splits` - разделения расходов
- `contracts` - договоры
- `registrar_assignments` - назначения регистраторов
- `sub_registrar_assignments` - назначения суб-регистраторов
- `sub_registrar_assignment_data` - данные назначений суб-регистраторов
- `distributor_requests` - запросы дистрибьюторов
- `sub_registrar_reports` - отчеты суб-регистраторов
- `export_contracts` - экспортные договоры
- `distributor_export_links` - связи дистрибьюторов с экспортом
- `idempotency_keys` - ключи идемпотентности
- `payment_priority_rules` - правила приоритетов платежей
- `file_validation_rules` - правила валидации файлов

### Индексы:
- `ix_idempotency_keys_key` - уникальный индекс для ключей идемпотентности
- `ix_idempotency_keys_request_hash` - индекс для хешей запросов
- `uk_split_group_sequence` - уникальный индекс для групп разделенных запросов

## Использование

### Инициализация пустой базы данных:
```bash
alembic upgrade head
```

### Откат к пустой базе данных:
```bash
alembic downgrade 18fb4e44fc7f
```

### Полный откат (удаление всех таблиц):
```bash
alembic downgrade base
```

## Совместимость

Миграция создана с учетом того, что на сервере можно выполнять только SQL команды. Все операции выполняются через Alembic, который генерирует соответствующие SQL команды для PostgreSQL.

## Проверка

Для проверки корректности миграции:
```bash
alembic history --verbose
```

Должна показать правильную цепочку миграций с базовой миграцией в начале.
