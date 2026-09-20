import os


class Settings:
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:Ram!1432@localhost/HireFlowApplicationDatabase",
    )
    APP_TITLE = os.getenv("APP_TITLE", "HireFlow Application")
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "c8b2f15a9e3d4c7b8a1f0e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


settings = Settings()
