from pydantic import BaseModel, Field, EmailStr

class CreateUser(BaseModel):
    login: str = Field(max_length=16)
    email: EmailStr
    password: str = Field(max_length=32)