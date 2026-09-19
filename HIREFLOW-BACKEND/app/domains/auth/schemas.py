from pydantic import BaseModel, Field


class PasswordUpdate(BaseModel):
    old_password: str = Field(min_length=6)
    new_password: str = Field(min_length=6)
    confirm_password: str = Field(min_length=6)
