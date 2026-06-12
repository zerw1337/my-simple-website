from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete, update
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from api.auth.schemas import UserOut
from api.notifications.dto import get_my_notifications_dto, get_welcome_notification_dto
from api.notifications.schemas import CreateNotification, CreateWelcomeNotification
from src.config import settings
from src.models.models import Notifications, Users, Comments, NotificationsList, NotificationsStatus, \
    WelcomeNotifications


async def create_welcome_notification_process(new_notification: CreateWelcomeNotification, session: AsyncSession):
    new_notification = WelcomeNotifications(
        title=new_notification.title,
        content=new_notification.content,
        refer_to=new_notification.refer_to,
        pinned=new_notification.pinned,
    )
    session.add(new_notification)
    await session.flush()
    query = (
        delete(WelcomeNotifications)
        .where(WelcomeNotifications.id != new_notification.id)
    )
    await session.execute(query)
    await session.commit()
    return


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
    users_ids_list = [user for user in result]
    return users_ids_list

async def create_new_message_notification(user_id: int , new_notification: CreateNotification, session: AsyncSession):
    ntf = Notifications(
        title = new_notification.title,
        body = new_notification.body,
        refer_to = new_notification.refer_to,
    )
    session.add(ntf)
    await session.flush()
    notification = NotificationsList(
            user_id=user_id,
            notification_id=ntf.id,
        )
    session.add(notification)
    await session.flush()
    await session.commit()


def create_notification_body(notif_type: str, post_id: int | None, chat_uuid: str | None) -> CreateNotification:
    if notif_type == settings.NOTIFICATION_NEW_POST:
        title = f"Новый пост!"
        body = f"Ты пропустил новый пост, кликни на уведомление для того чтобы ознакомиться!"
        refer_to = f"https://zerw1337.ru/posts/{post_id}/"
    elif notif_type == settings.NOTIFICATION_NEW_COMMENT:
        title = f"Новый комментарий!"
        body = f"Кто-то оставил комментарий в обсуждении с твойм участием, кликни на уведомление для того чтобы ознакомиться!"
        refer_to = f"https://zerw1337.ru/posts/{post_id}/"
    elif notif_type == settings.NOTIFICATION_NEW_MESSAGE:
        title = f"Новое сообщение!"
        body = f"Пришло новое сообщение, кликни на уведомление для того чтобы ознакомиться!"
        refer_to = f"https://zerw1337.ru/messages/{chat_uuid}/"
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

async def get_welcome_notification_process(session: AsyncSession):
    query = (
        select(WelcomeNotifications)
    )
    res = await session.execute(query)
    result = res.scalars().all()
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif_dto = get_welcome_notification_dto(notifications=result)
    return notif_dto

async def delete_current_welcome_notification(notification_id: int, user: UserOut, session: AsyncSession):
    query = (
        delete(WelcomeNotifications)
        .where(WelcomeNotifications.id == notification_id)
    )
    await session.execute(query)
    await session.commit()
    return