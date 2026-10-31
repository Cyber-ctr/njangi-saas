from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator


class Settings(BaseSettings):
    app_name: str = "NjangiFlow AI"
    environment: Literal["development", "test", "staging", "production"] = "development"
    # Default to a local SQLite file for fast local development when
    # a DATABASE_URL is not provided. Use the `.env` file to override
    # with a production Postgres URL (e.g. postgresql+psycopg://...).
    database_url: str = "sqlite:///./njangi.db"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "development-only-key-do-not-use-outside-local"
    access_token_expire_minutes: int = Field(default=60, ge=5, le=1440)
    cors_origins: str = "http://localhost:5173,http://localhost:4173"
    allowed_hosts: str = "localhost,127.0.0.1,testserver"
    forwarded_allow_ips: str = "127.0.0.1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @property
    def cors_list(self):
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

    @property
    def allowed_hosts_list(self):
        return [x.strip() for x in self.allowed_hosts.split(",") if x.strip()]

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.environment != "production":
            return self

        if len(self.secret_key) < 32 or self.secret_key == "development-only-key-do-not-use-outside-local":
            raise ValueError("SECRET_KEY must be a unique, random value of at least 32 characters in production")
        if not self.database_url.startswith((
            "postgresql://",
            "postgresql+psycopg://",
            "postgresql+psycopg2://",
        )):
            raise ValueError("Production requires a PostgreSQL DATABASE_URL")
        if not self.redis_url.startswith(("redis://", "rediss://")):
            raise ValueError("Production requires a Redis REDIS_URL for shared rate limiting")
        if not self.cors_list or any(origin == "*" for origin in self.cors_list):
            raise ValueError("Production CORS_ORIGINS must be an explicit origin allowlist")
        if any("localhost" in origin or "127.0.0.1" in origin for origin in self.cors_list):
            raise ValueError("Production CORS_ORIGINS must not include localhost")
        if not self.allowed_hosts_list or "*" in self.allowed_hosts_list:
            raise ValueError("Production ALLOWED_HOSTS must be an explicit host allowlist")
        if any(host in {"localhost", "127.0.0.1", "testserver"} for host in self.allowed_hosts_list):
            raise ValueError("Production ALLOWED_HOSTS must not include development hosts")
        if not self.forwarded_allow_ips.strip() or self.forwarded_allow_ips.strip() == "*":
            raise ValueError("Production FORWARDED_ALLOW_IPS must identify trusted proxy addresses")
        return self


settings = Settings()
