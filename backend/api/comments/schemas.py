from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from api.auth.schemas import UserOut




class Comment(BaseModel):
    id: int
    content: str
    user_id: int
    post_id: int
    created_at: datetime
    user: UserOut

    model_config = ConfigDict(from_attributes=True)



class CreateComment(BaseModel):
    content: str = Field(... ,max_length=255, min_length=3)
    post_id: int