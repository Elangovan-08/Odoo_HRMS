from functools import lru_cache
from typing import Literal
from urllib.parse import quote_plus
from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "App Backend"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    PORT: int = 8000

    SECRET_KEY: str = Field(..., description="JWT Secret Key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    DB_HOST: str
    DB_PORT: int
    DB_USER: str = "root"
    MYSQL_ROOT_PASSWORD: str
    MYSQL_DATABASE: str

    BACKEND_CORS_ORIGINS: list[str] = Field(default=["http://localhost:5173"])

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
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