from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Every field can be set with a PILOT_-prefixed env var."""

    model_config = SettingsConfigDict(env_prefix="PILOT_", env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./data/pilot.db"
    # Empty admin token disables every /api/admin route.
    admin_token: str = ""
    # Behind Cloudflare Tunnel the browser always sees HTTPS, so cookies are Secure by default.
    # Set PILOT_COOKIE_SECURE=false only for plain-http local development.
    cookie_secure: bool = True
    cookie_name: str = "pilot_session"
    session_days: int = 120
    expose_docs: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
