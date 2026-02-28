from pydantic import BaseModel, Field, ConfigDict


class Category(BaseModel):
    id: int
    name: str
    emoji: str
    description: str

    model_config = ConfigDict(from_attributes=True)

class CreateCategory(BaseModel):
    name: str = Field(..., min_length=1, max_length=32)
    emoji: str = Field(max_length=8)
    description: str = Field(max_length=256)

class EditCategory(BaseModel):
    name: str | None = Field(..., min_length=1, max_length=32)
    emoji: str | None = Field(max_length=8)
    description: str | None = Field(max_length=256)
