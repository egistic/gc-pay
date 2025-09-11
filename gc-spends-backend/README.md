# GC Spends — FastAPI Backend

Production-ready scaffold for the payments workflow (Executor → Registrar → Distributor → Treasurer).
Includes modular architecture, Alembic migrations, JWT auth, PostgreSQL, Docker, and seed script.

## 🚀 Быстрый старт

### Автоматический запуск (рекомендуется)
```bash
./start_all.sh
```

### Ручной запуск (локально)
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Docker запуск
```bash
cp .env.example .env
docker compose up --build
```

### Инициализация данных
```bash
python manage.py seed  # optional XLSX seeding if files are present
```

## 📚 Документация API

### Онлайн документация
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json
- **Health Check**: http://localhost:8000/health

### Статическая документация
- **HTML документация**: http://localhost:8080/docs.html
- **Автономная документация**: `published_docs/standalone.html`
- **Архив для публикации**: `gc-spends-api-docs.zip`
- **Директория**: `published_docs/`

> **Примечание**: Статическая документация использует локальные файлы Swagger UI для совместимости с CSP политикой. Подробности в [CSP_FIX_README.md](CSP_FIX_README.md)

### Публикация документации
```bash
# Создание пакета для публикации
python publish_docs.py

# Результат: gc-spends-api-docs.zip
```

## 🏗️ Структура проекта

```
app/
├── main.py              # Основное приложение FastAPI
├── models.py            # SQLAlchemy модели
├── core/
│   ├── config.py        # Конфигурация
│   ├── db.py           # Подключение к БД
│   └── security.py     # JWT и безопасность
└── modules/            # Модули API
    ├── auth/           # Аутентификация
    ├── users/          # Пользователи
    ├── requests/       # Запросы
    ├── dictionaries/   # Справочники
    ├── files/          # Файлы
    ├── registry/       # Реестр
    ├── distribution/   # Распределение
    ├── sub_registrar/  # Суб-регистратор
    ├── distributor/    # Дистрибьютор
    └── export_contracts/ # Экспорт контрактов
```

## 📋 Основные модули

- **Аутентификация** (`/api/v1/auth/`) - Вход в систему, управление токенами
- **Пользователи** (`/api/v1/users/`) - Управление пользователями
- **Роли** (`/api/v1/roles/`) - Управление ролями и правами
- **Запросы** (`/api/v1/requests/`) - Платежные запросы
- **Справочники** (`/api/v1/dictionaries/`) - Статьи расходов, категории
- **Файлы** (`/api/v1/files/`) - Загрузка и управление файлами
- **Реестр** (`/api/v1/registry/`) - Реестр документов
- **Распределение** (`/api/v1/distribution/`) - Распределение средств
- **Экспорт** (`/api/v1/export-contracts/`) - Экспорт контрактов

## 🔧 Конфигурация

### Переменные окружения
Создайте файл `.env`:

```env
# База данных
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/grainchain

# JWT секрет
JWT_SECRET=your_secret_key_here

# CORS origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Окружение
APP_ENV=local
```

## 🛠️ Разработка

### Тестирование API
```bash
# Получение токена
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=email@example.com&password=password"

# Использование токена
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📞 Поддержка

- **Документация**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Swagger UI**: http://localhost:8000/docs
- **Email**: support@gcspends.com

