# app/core/config.py
from __future__ import annotations
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import json

class Settings(BaseSettings):
    # base
    app_env: str = "local"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://kads_user:kads_password@localhost:5432/grainchain"

    # security
    jwt_secret: str = "change_me"
    jwt_expire_minutes: int = 43200

    # cors (можно CSV или JSON-массив)
    cors_origins: List[str] | str = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]

    # files
    file_storage: str = "local"
    file_upload_dir: str = "./storage"

    # logging
    log_level: str = "INFO"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            s = v.strip()
            if s.startswith("[") and s.endswith("]"):
                return json.loads(s)
            return [item.strip() for item in s.split(",") if item.strip()]
        return []

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        # важно: лишние ключи не ломают приложение
        "extra": "ignore",
    }

settings = Settings()
