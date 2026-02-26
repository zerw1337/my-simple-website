from pydantic import BaseModel, Field, EmailStr
from datetime import date

class CreateUser(BaseModel):
    username: str = Field(..., min_length=3, max_length=16, pattern=r'^[a-zA-Z0-9_]+$')
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=32)

class CreateProfile(BaseModel):
    first_name: str = Field(..., max_length=64)
    last_name: str = Field(..., max_length=64)
    birthday: date
    bio: str = Field(max_length=255)

