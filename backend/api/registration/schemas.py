from pydantic import BaseModel, Field, EmailStr

class CreateUser(BaseModel):
    username: str = Field(..., min_length=3, max_length=16, pattern=r'^[a-zA-Z0-9_]+$')
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=32)