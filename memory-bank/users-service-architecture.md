# Users Service Architecture

## Архитектурная диаграмма

```
┌─────────────────────────────────────────────────────────────┐
│                    Users Service                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Users Router  │    │  Roles Router   │                │
│  │   /api/users    │    │   /api/roles    │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           └───────────┬───────────┘                        │
│                       │                                    │
│  ┌─────────────────────────────────────────────────────────┤
│  │              Business Logic Layer                       │
│  │  • User Management                                     │
│  │  • Role Management                                     │
│  │  • User-Role Assignment                               │
│  │  • Data Validation                                    │
│  │  • Security (Password Hashing)                        │
│  └─────────────────────────────────────────────────────────┤
│                       │                                    │
│  ┌─────────────────────────────────────────────────────────┤
│  │              Data Access Layer                          │
│  │  • SQLAlchemy ORM                                      │
│  │  • Database Models                                     │
│  │  • Query Optimization                                  │
│  └─────────────────────────────────────────────────────────┤
│                       │                                    │
│  ┌─────────────────────────────────────────────────────────┤
│  │              Database Layer                             │
│  │  • PostgreSQL Database                                 │
│  │  • Users Table                                         │
│  │  • Roles Table                                         │
│  │  • UserRoles Table                                     │
│  └─────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
```

## Компоненты системы

### 1. API Layer (FastAPI)
- **Users Router** (`/api/users`) - Управление пользователями
- **Roles Router** (`/api/roles`) - Управление ролями
- **Request/Response Validation** - Pydantic модели
- **Error Handling** - HTTP статус коды и сообщения

### 2. Business Logic Layer
- **User Management** - CRUD операции для пользователей
- **Role Management** - CRUD операции для ролей
- **User-Role Assignment** - Назначение ролей пользователям
- **Data Validation** - Валидация входных данных
- **Security** - Хеширование паролей

### 3. Data Access Layer
- **SQLAlchemy ORM** - Объектно-реляционное отображение
- **Database Models** - Модели User, Role, UserRole
- **Query Optimization** - Оптимизация запросов к БД
- **Transaction Management** - Управление транзакциями

### 4. Database Layer
- **PostgreSQL** - Реляционная база данных
- **Users Table** - Хранение данных пользователей
- **Roles Table** - Хранение ролей системы
- **UserRoles Table** - Связь пользователей с ролями

## Поток данных

### Создание пользователя
```
Client Request → Users Router → Business Logic → Data Access → Database
                ↓
Client Response ← JSON Response ← UserOut Model ← User Object ← Database Record
```

### Назначение роли пользователю
```
Client Request → Users Router → Business Logic → Data Access → Database
                ↓
Client Response ← UserWithRoles ← User + Roles ← Database Records
```

## Модели данных

### User Model
```python
class User(Base):
    __tablename__ = "users"
    id: UUID (Primary Key)
    full_name: str
    email: str (Unique)
    phone: str (Optional)
    password_hash: str
    is_active: bool
```

### Role Model
```python
class Role(Base):
    __tablename__ = "roles"
    id: UUID (Primary Key)
    code: str (Unique)
    name: str
```

### UserRole Model
```python
class UserRole(Base):
    __tablename__ = "user_roles"
    id: UUID (Primary Key)
    user_id: UUID (Foreign Key → users.id)
    role_id: UUID (Foreign Key → roles.id)
    valid_from: date
    valid_to: date (Optional)
    is_primary: bool
```

## Безопасность

### Password Security
- **Хеширование**: Пароли хешируются с помощью bcrypt
- **Соль**: Автоматическая генерация соли для каждого пароля
- **Валидация**: Проверка сложности пароля

### Data Validation
- **Email Validation**: Проверка корректности email адресов
- **UUID Validation**: Валидация UUID параметров
- **Input Sanitization**: Очистка входных данных

### Access Control
- **Role-based Access**: Контроль доступа на основе ролей
- **Permission Management**: Управление правами доступа
- **Session Management**: Управление сессиями пользователей

## Производительность

### Database Optimization
- **Indexes**: Индексы на часто используемые поля
- **Query Optimization**: Оптимизация SQL запросов
- **Connection Pooling**: Пул соединений с БД

### Caching Strategy
- **User Data Caching**: Кэширование данных пользователей
- **Role Data Caching**: Кэширование данных ролей
- **Session Caching**: Кэширование сессий

### Monitoring
- **Performance Metrics**: Метрики производительности
- **Error Tracking**: Отслеживание ошибок
- **Usage Analytics**: Аналитика использования

## Масштабируемость

### Horizontal Scaling
- **Load Balancing**: Балансировка нагрузки
- **Microservices**: Разделение на микросервисы
- **API Gateway**: Шлюз для API

### Vertical Scaling
- **Resource Optimization**: Оптимизация ресурсов
- **Database Scaling**: Масштабирование БД
- **Memory Management**: Управление памятью

## Интеграция

### External Systems
- **LDAP Integration**: Интеграция с LDAP
- **SSO Support**: Поддержка единого входа
- **OAuth2**: Аутентификация через OAuth2

### Internal Systems
- **Payment Requests**: Интеграция с заявками на оплату
- **Registry Service**: Интеграция с реестром
- **File Service**: Интеграция с файловым сервисом

## Мониторинг и логирование

### Logging
- **Structured Logging**: Структурированное логирование
- **Log Levels**: Уровни логирования (DEBUG, INFO, WARN, ERROR)
- **Log Aggregation**: Агрегация логов

### Monitoring
- **Health Checks**: Проверки здоровья сервиса
- **Metrics Collection**: Сбор метрик
- **Alerting**: Система оповещений

### Observability
- **Distributed Tracing**: Распределенная трассировка
- **Performance Profiling**: Профилирование производительности
- **Error Tracking**: Отслеживание ошибок
