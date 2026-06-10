from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date


class ProfileOut(BaseModel):
    first_name: str = Field(..., max_length=64)
    last_name: str = Field(..., max_length=64)
    birthday: date
    bio: str = Field(max_length=255)
    username : str | None = None
    user_id: int | None = None
    last_seen: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


