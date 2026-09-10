from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "NjangiFlow AI"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://njangi:njangi@localhost:5432/njangi"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 720
    cors_origins: str = "http://localhost:5173,http://localhost:4173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_list(self):
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]


settings = Settings()
