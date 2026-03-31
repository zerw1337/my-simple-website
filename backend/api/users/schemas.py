from pydantic import BaseModel, Field

class ChangePassword(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=32)