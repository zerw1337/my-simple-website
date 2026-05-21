from typing import Sequence

from api.notifications.schemas import NotificationsListOut, Notification
from src.models.models import NotificationsList


def get_my_notifications_dto(notifications: Sequence[NotificationsList]) -> list[NotificationsListOut]:
    result = []
    for notif in notifications:
        n = NotificationsListOut(
            user_id=notif.user_id,
            status=notif.status,
            notification=Notification(
                body=notif.notification.body,
                title=notif.notification.title,
                created_at=notif.notification.created_at,
            )
        )
        result.append(n)
    return result