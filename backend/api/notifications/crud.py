from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from api.auth.schemas import UserOut
from api.notifications.dto import get_my_notifications_dto
from api.notifications.schemas import CreateNotification
from src.config import settings
from src.models.models import Notifications, Users, Comments, NotificationsList


async def create_custom_notification_process(new_notification: CreateNotification, session: AsyncSession):
    query = (
        select(Users.id)
        .order_by(Users.id.desc())
    )
    res = await session.execute(query)
    result = res.scalars().all()
    notification = Notifications(
        title=new_notification.title,
        body=new_notification.body,
    )
    session.add(notification)
    await session.flush()
    notifications = [
        NotificationsList(
            user_id=user,
            notification_id=notification.id,
        )
        for user in result
    ]
    session.add_all(notifications)
    await session.commit()

async def create_new_post_notification(new_notification: CreateNotification, session: AsyncSession):
    query = (
        select(Users.id)
        .order_by(Users.id.desc())
    )
    res = await session.execute(query)
    result = res.scalars().all()
    notification = Notifications(
        title=new_notification.title,
        body=new_notification.body,
    )
    session.add(notification)
    await session.flush()
    notifications = [
        NotificationsList(
            user_id=user,
            notification_id=notification.id
        )
        for user in result
    ]
    session.add_all(notifications)

async def create_new_comment_notification(new_notification: CreateNotification, post_id: int, session: AsyncSession):
    query = (
        select(Comments)
        .where(Comments.post_id == post_id)
    )
    res = await session.execute(query)
    result = res.scalars().all()
    if len(result) <= 1:
        return
    query = (
        select(Comments.user_id)
        .where(Comments.post_id == post_id)
    )
    res = await session.execute(query)
    result = set(res.scalars().all())
    notification = Notifications(
            title=new_notification.title,
            body=new_notification.body,
        )
    session.add(notification)
    await session.flush()
    notifications = [
        NotificationsList(
            user_id=user,
            notification_id=notification.id
        )
        for user in result
    ]
    session.add_all(notifications)

def create_notification_body(notif_type: str, post_id: int) -> CreateNotification:
    if notif_type == settings.NOTIFICATION_NEW_POST:
        title = f"New post!"
        body = f"Checkout new post here: https://zerw1337.ru/posts/{post_id}/ !"
    elif notif_type == settings.NOTIFICATION_NEW_COMMENT:
        title = f"New comment!"
        body = f"Someone recently commented after your comment! Go check out here: https://zerw1337.ru/posts/{post_id}/ ! "
    else:
        raise HTTPException(status_code=403, detail="Forbidden")
    new_notification = CreateNotification(
        title=title,
        body=body
    )
    return new_notification

async def get_my_notifications(user: UserOut, session: AsyncSession):
    query = (
        select(NotificationsList)
        .where(NotificationsList.user_id == user.id)
        .options(selectinload(NotificationsList.notification))
    )
    res = await session.execute(query)
    result = res.scalars().all()
    result_dto = get_my_notifications_dto(notifications=result)
    return result_dto
