from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.modules.users.router import router as users_router
from app.modules.users.roles_router import router as roles_router
from app.modules.requests.router import router as requests_router
from app.modules.files.router import router as files_router
# from app.modules.auth.router import router as auth_router
from app.modules.dictionaries.router import router as dictionaries_router
from app.modules.registry.router import router as registry_router
from app.modules.distribution.router import router as distribution_router

app = FastAPI(title="GC Spends API", version="0.1.0")

api = FastAPI()

# Add CORS middleware to both app and api
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.mount(settings.api_prefix, api)

# Include all routers
# api.include_router(auth_router)  # Temporarily disabled for Phase 1
api.include_router(users_router)
api.include_router(roles_router)
api.include_router(requests_router)
api.include_router(files_router)
api.include_router(dictionaries_router)
api.include_router(registry_router)
api.include_router(distribution_router)

@app.get("/health")
def health():
    return {"status": "ok"}
