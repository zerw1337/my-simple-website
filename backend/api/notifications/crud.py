from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from api.auth.schemas import UserOut
from api.notifications.dto import get_my_notifications_dto
from api.notifications.schemas import CreateNotification
from src.config import settings
from src.models.models import Notifications, Users, Comments, NotificationsList, NotificationsStatus


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
        refer_to=new_notification.refer_to,
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
        refer_to=new_notification.refer_to,
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

async def create_new_comment_notification(new_notification: CreateNotification, post_id: int, current_user_id: int, session: AsyncSession):
    query = (
        select(Comments.user_id)
        .where(Comments.post_id == post_id)
    )
    res = await session.execute(query)
    result = set(res.scalars().all())
    notification = Notifications(
            title=new_notification.title,
            body=new_notification.body,
            refer_to=new_notification.refer_to,
        )
    session.add(notification)
    await session.flush()
    notifications = [
        NotificationsList(
            user_id=user,
            notification_id=notification.id
        )
        for user in result if user != current_user_id
    ]
    session.add_all(notifications)

def create_notification_body(notif_type: str, post_id: int) -> CreateNotification:
    if notif_type == settings.NOTIFICATION_NEW_POST:
        title = f"New post!"
        body = f"Go checkout new post!"
        refer_to = f"https://zerw1337.ru/posts/{post_id}/"
    elif notif_type == settings.NOTIFICATION_NEW_COMMENT:
        title = f"New comment!"
        body = f"Someone recently commented after your comment! Go check it out! "
        refer_to = f"https://zerw1337.ru/posts/{post_id}/"
    else:
        raise HTTPException(status_code=403, detail="Forbidden")
    new_notification = CreateNotification(
        title=title,
        body=body,
        refer_to=refer_to,
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

async def read_current_notification(notification_id: int, user: UserOut, session: AsyncSession):
    query = (
        select(NotificationsList)
        .where(and_(NotificationsList.id == notification_id, NotificationsList.user_id == user.id, NotificationsList.status == NotificationsStatus.unread))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    result.status = NotificationsStatus.read
    await session.commit()
    return

async def read_current_users_all_notifications(user: UserOut, session: AsyncSession):
    query = (
        select(NotificationsList)
        .where(and_(NotificationsList.user_id == user.id, NotificationsList.status == NotificationsStatus.unread))
    )
    res = await session.execute(query)
    result = res.scalars().all()
    if not result:
        raise HTTPException(status_code=404, detail="Notifications not found")
    for notification in result:
        notification.status = NotificationsStatus.read
    await session.commit()
    return

async def delete_current_notification(notification_id: int, user: UserOut, session: AsyncSession):
    query = (
        select(NotificationsList)
        .where(and_(NotificationsList.id == notification_id, NotificationsList.user_id == user.id))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    await session.delete(result)
    await session.commit()
    return

async def delete_current_users_all_notifications(user: UserOut, session: AsyncSession):
    query = (
        select(NotificationsList)
        .where(and_(NotificationsList.user_id == user.id))
    )
    res = await session.execute(query)
    result = res.scalars().all()
    if not result:
        raise HTTPException(status_code=404, detail="Notifications not found")
    for notification in result:
        await session.delete(notification)
    await session.commit()
    return