from datetime import datetime
from pydantic import BaseModel, ConfigDict

from src.models.models import NotificationsStatus


class CreateNotification(BaseModel):
    title: str
    body: str

class Notification(BaseModel):
    title: str
    body: str
    created_at: datetime

class NotificationsListOut(BaseModel):
    user_id: int
    status: NotificationsStatus
    notification: Notification

    model_config = ConfigDict(from_attributes=True)



