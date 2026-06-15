from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.testing import exclude

from api.auth.schemas import UserOut
from api.categories.schemas import Category


class CreatePost(BaseModel):
    title: str = Field(... , min_length=3, max_length=255)
    content: str = Field(... , min_length=3)
    category_id: int

class UpdatePost(BaseModel):
    title: str | None = Field(None , min_length=3, max_length=255)
    category_id: int | None = None
    content: str | None = Field(None , min_length=3)

class PostOut(BaseModel):
    id: int
    title: str
    content: str
    category: Category
    user: UserOut
    created_at: datetime
    updated_at: datetime
    views: int
    rating: int
    next_post_id: int | None = None
    previous_post_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


