from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    app_password: str | None = None
    vapid_private_key: str | None = None
    vapid_public_key: str | None = None
    vapid_claims_email: str | None = None
    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
