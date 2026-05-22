from typing import Sequence

from api.notifications.schemas import NotificationsListOut, Notification, WelcomeNotificationOut
from src.models.models import NotificationsList, WelcomeNotifications


def get_my_notifications_dto(notifications: Sequence[NotificationsList]) -> list[NotificationsListOut]:
    result = []
    for notif in notifications:
        n = NotificationsListOut(
            id=notif.id,
            user_id=notif.user_id,
            status=notif.status,
            notification=Notification(
                body=notif.notification.body,
                title=notif.notification.title,
                refer_to=notif.notification.refer_to,
                created_at=notif.notification.created_at,
            )
        )
        result.append(n)
    return result

def get_welcome_notification_dto(notifications: Sequence[WelcomeNotifications]) -> list[WelcomeNotificationOut]:
    res = []
    for notif in notifications:
        n = WelcomeNotificationOut.model_validate(notif)
        res.append(n)
    return res