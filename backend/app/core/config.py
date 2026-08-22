from functools import lru_cache
from typing import Literal
from urllib.parse import quote_plus
from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Dayflow HRMS"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    PORT: int = 8000

    SECRET_KEY: str = Field(default="w+IS+ySboMiM4rZk6i70vDUcNuFqPHXbBqnsj200KhE=", description="JWT Secret Key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    MYSQL_ROOT_PASSWORD: str = "1234"
    MYSQL_DATABASE: str = "hrms_db"
    USE_SQLITE_FALLBACK: bool = True

    BACKEND_CORS_ORIGINS: list[str] = Field(default=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"])

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        if self.DB_HOST == "sqlite":
            return "sqlite+aiosqlite:///./dayflow.db"
        return (
            f"mysql+aiomysql://{quote_plus(self.DB_USER)}:{quote_plus(self.MYSQL_ROOT_PASSWORD)}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{quote_plus(self.MYSQL_DATABASE)}"
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()