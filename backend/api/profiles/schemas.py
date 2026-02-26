from pydantic import BaseModel, Field, ConfigDict
from datetime import date

class UserId(BaseModel):
    id: int = Field(lt=10000, gt=0)

class ProfileOut(BaseModel):
    first_name: str = Field(..., max_length=64)
    last_name: str = Field(..., max_length=64)
    birthday: date
    bio: str = Field(max_length=255)

    model_config = ConfigDict(from_attributes=True)


