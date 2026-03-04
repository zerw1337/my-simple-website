from datetime import datetime
from pydantic import BaseModel, ConfigDict




class Comment(BaseModel):
    id: int
    content: str
    user_id: int
    post_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class CreateComment(BaseModel):
    content: str
    post_id: int