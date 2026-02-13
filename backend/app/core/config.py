from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/outmate"
    redis_url: str = "redis://redis:6379/0"
    explorium_api_key: str = ""
    explorium_base_url: str = "https://api.explorium.ai"
    explorium_match_path: str = "/v1/businesses/match"
    explorium_enrich_path: str = "/v1/businesses/firmographics/enrich"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def normalized_database_url(self) -> str:
        # Render commonly provides postgres:// or postgresql:// URLs.
        # SQLAlchemy with psycopg driver expects postgresql+psycopg://.
        url = self.database_url
        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://") :]
        if url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
            return "postgresql+psycopg://" + url[len("postgresql://") :]
        return url


settings = Settings()
