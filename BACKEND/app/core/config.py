import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL = os.environ["DATABASE_URL"]
    APP_TITLE = os.getenv("APP_TITLE", "HireFlow Application")
    SECRET_KEY: str = os.environ["SECRET_KEY"]
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


settings = Settings()
