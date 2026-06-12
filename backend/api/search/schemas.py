from datetime import datetime
from pydantic import BaseModel, ConfigDict

class UserSearch(BaseModel):
    id: int
    username: str
    last_seen: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class CategorySearch(BaseModel):
    id: int
    title: str

    model_config = ConfigDict(from_attributes=True)

class PostSearch(BaseModel):
    id: int
    title: str
    content: str

    model_config = ConfigDict(from_attributes=True)
