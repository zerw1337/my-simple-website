from datetime import datetime
from pydantic import BaseModel, ConfigDict

from src.models.models import NotificationsStatus


class CreateNotification(BaseModel):
    title: str
    body: str
    refer_to: str | None

class CreateWelcomeNotification(BaseModel):
    title: str
    content: str
    refer_to: str | None
    pinned: bool = True

class Notification(BaseModel):
    title: str
    body: str
    refer_to: str | None
    created_at: datetime

class NotificationsListOut(BaseModel):
    id: int
    user_id: int
    status: NotificationsStatus
    notification: Notification

    model_config = ConfigDict(from_attributes=True)

class WelcomeNotificationOut(BaseModel):
    id: int
    title: str
    content: str
    refer_to: str | None
    created_at: datetime
    pinned: bool

    model_config = ConfigDict(from_attributes=True)


