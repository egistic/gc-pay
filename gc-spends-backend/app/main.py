from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
import uuid
import time
from app.modules.users.router import router as users_router
from app.modules.users.roles_router import router as roles_router
from app.modules.users.expense_article_roles_router import router as expense_article_roles_router
from app.modules.users.positions_router import router as positions_router
from app.modules.requests.router import router as requests_router
from app.modules.files.router import router as files_router
from app.modules.auth.router import router as auth_router
from app.modules.dictionaries.router import router as dictionaries_router
from app.modules.dictionaries.audit_router import router as dictionaries_audit_router
from app.modules.dictionaries.import_export_router import router as dictionaries_import_export_router
from app.modules.registry.router import router as registry_router
from app.modules.distribution.router import router as distribution_router
from app.modules.sub_registrar.router import router as sub_registrar_router
from app.modules.distributor.router import router as distributor_router
from app.modules.export_contracts.router import router as export_contracts_router
from app.modules.admin.router import router as admin_router
from app.modules.idempotency.router import router as idempotency_router
from app.modules.priority.router import router as priority_router
from app.modules.file_management.router import router as file_management_router
from app.modules.monitoring.router import router as monitoring_router
from app.modules.registrar_assignment import router as registrar_assignment_router
from app.modules.sub_registrar_assignment_data import router as sub_registrar_assignment_data_router
from app.core.idempotency import IdempotencyMiddleware
from app.core.monitoring import monitoring_middleware

app = FastAPI(
    title="GC Spends API",
    version="1.0.0",
    description="""
    ## GC Spends API - Система управления расходами и платежами
    
    Это API для управления системой расходов и платежей, включающая в себя:
    
    * **Аутентификация и авторизация** - управление пользователями и ролями
    * **Управление запросами** - создание и обработка платежных запросов
    * **Справочники** - управление статьями расходов и другими справочными данными
    * **Регистрация** - ведение реестра документов
    * **Распределение** - управление распределением средств
    * **Экспорт контрактов** - работа с контрактными данными
    * **Файлы** - загрузка и управление файлами
    
    ### Аутентификация
    API использует JWT токены для аутентификации. Получите токен через `/api/v1/auth/login` и используйте его в заголовке `Authorization: Bearer <token>`.
    
    ### Базовый URL
    Все API endpoints доступны по адресу: `http://localhost:8000/api/v1/`
    """,
    contact={
        "name": "GC Spends Team",
        "email": "support@gcspends.com",
    },
    license_info={
        "name": "MIT",
    },
    servers=[
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": "https://gcback.openlayers.kz",
            "description": "Production server"
        }
    ],
    openapi_tags=[
        {
            "name": "auth",
            "description": "Аутентификация и авторизация пользователей"
        },
        {
            "name": "users",
            "description": "Управление пользователями системы"
        },
        {
            "name": "roles",
            "description": "Управление ролями и правами доступа"
        },
        {
            "name": "requests",
            "description": "Управление платежными запросами"
        },
        {
            "name": "dictionaries",
            "description": "Справочники системы (статьи расходов, категории и т.д.)"
        },
        {
            "name": "files",
            "description": "Загрузка и управление файлами"
        },
        {
            "name": "registry",
            "description": "Реестр документов"
        },
        {
            "name": "distribution",
            "description": "Распределение средств"
        },
        {
            "name": "sub-registrar",
            "description": "Функции суб-регистратора"
        },
        {
            "name": "distributor",
            "description": "Функции дистрибьютора"
        },
        {
            "name": "export-contracts",
            "description": "Экспорт контрактных данных"
        },
        {
            "name": "admin",
            "description": "Административные функции системы"
        },
        {
            "name": "idempotency",
            "description": "Управление идемпотентными ключами для API запросов"
        },
        {
            "name": "priority",
            "description": "Управление приоритетами платежных запросов"
        },
        {
            "name": "file-management",
            "description": "Расширенное управление файлами с валидацией"
        },
        {
            "name": "monitoring",
            "description": "Мониторинг и наблюдение за системой"
        },
        {
            "name": "registrar-assignments",
            "description": "Назначения регистратора для классификации заявок"
        },
        {
            "name": "sub-registrar-assignment-data",
            "description": "Данные суб-регистратора для обогащения заявок"
        },
        {
            "name": "health",
            "description": "Проверка состояния системы"
        }
    ]
)

api = FastAPI(
    title="GC Spends API v1",
    version="1.0.0",
    description="API для управления системой расходов и платежей"
)

# Add CORS middleware to both app and api
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRFToken",
        "X-API-Key",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=[
        "X-Process-Time",
        "X-Request-ID",
        "X-Total-Count"
    ],
    max_age=3600,  # Cache preflight requests for 1 hour
)

api.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language", 
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRFToken",
        "X-API-Key",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=[
        "X-Process-Time",
        "X-Request-ID", 
        "X-Total-Count"
    ],
    max_age=3600,
)

# Add security middleware
if settings.app_env == "production":
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["gcback.openlayers.kz", "*.openlayers.kz", "localhost"]
    )

# Add GZip compression middleware
app.add_middleware(
    GZipMiddleware, 
    minimum_size=1000  # Only compress responses > 1KB
)

# Add idempotency middleware
app.add_middleware(IdempotencyMiddleware, expire_hours=24)

# Add monitoring middleware
app.middleware("http")(monitoring_middleware)

# Add custom security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self' https://gcback.openlayers.kz"
    
    # Remove server information
    if "Server" in response.headers:
        del response.headers["Server"]
    
    return response

# Add request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response

# Add process time middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Add explicit OPTIONS handler for API
@api.options("/{path:path}")
async def options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": ", ".join(settings.allowed_origins),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-CSRFToken, X-API-Key, Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600"
        }
    )

# Include all routers
api.include_router(auth_router)
api.include_router(users_router)
api.include_router(roles_router)
api.include_router(expense_article_roles_router)
api.include_router(positions_router)
api.include_router(requests_router)
api.include_router(files_router)
api.include_router(dictionaries_router)
api.include_router(dictionaries_audit_router)
api.include_router(dictionaries_import_export_router)
api.include_router(registry_router)
api.include_router(distribution_router)
api.include_router(sub_registrar_router)
api.include_router(distributor_router)
api.include_router(export_contracts_router)
api.include_router(admin_router)
api.include_router(idempotency_router)
api.include_router(priority_router)
api.include_router(file_management_router)
api.include_router(monitoring_router)
api.include_router(registrar_assignment_router)
api.include_router(sub_registrar_assignment_data_router)

app.mount(settings.api_prefix, api)

@app.options("/{path:path}")
async def app_options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight on main app"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": ", ".join(settings.allowed_origins),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-CSRFToken, X-API-Key, Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600"
        }
    )

@app.get("/health", tags=["health"], summary="Проверка состояния системы")
def health():
    """
    Проверка состояния API сервера.
    
    Возвращает статус "ok" если сервер работает корректно.
    """
    return {"status": "ok"}
