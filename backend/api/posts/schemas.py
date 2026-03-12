from datetime import datetime
from pydantic import BaseModel, ConfigDict
from sqlalchemy.testing import exclude

from api.auth.schemas import UserOut
from api.categories.schemas import Category


class CreatePost(BaseModel):
    title: str
    content: str
    category_id: int

class UpdatePost(BaseModel):
    title: str | None = None
    category_id: int | None = None
    content: str | None = None

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

    model_config = ConfigDict(from_attributes=True)


