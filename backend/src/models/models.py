from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey, func, DateTime, UniqueConstraint, Enum as SAEnum, Integer, Boolean
import datetime
from enum import Enum

from src.models.database import Base


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        UniqueConstraint('username'),
        UniqueConstraint('email'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow, server_default=func.now())
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_banned: Mapped[bool] = mapped_column(default=False, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(default=False, nullable=True)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=True)
    user_version: Mapped[int] = mapped_column(default=1, nullable=False)
    pending_email: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)

    refresh_tokens: Mapped[list["RefreshTokens"]] = relationship("RefreshTokens", back_populates="user", cascade="all, delete-orphan")
    profile: Mapped["Profiles"] = relationship("Profiles" ,back_populates="user", uselist=False, cascade="all, delete-orphan")
    posts: Mapped["Posts"] = relationship("Posts", back_populates="user", cascade="all, delete-orphan")
    comments: Mapped[list["Comments"]] = relationship("Comments", back_populates="user", cascade="all, delete-orphan")
    reactions: Mapped[list["Reactions"]] = relationship("Reactions", back_populates="user", cascade="all, delete-orphan")
    verify_codes: Mapped[list["VerifyCodes"]] = relationship("VerifyCodes", back_populates="user", cascade="all, delete-orphan")
    messages: Mapped[list["Messages"]] = relationship("Messages", back_populates="user", cascade="all, delete-orphan")



class RefreshTokens(Base):
    __tablename__ = 'refresh_tokens'

    id: Mapped[int] = mapped_column(primary_key=True)
    refresh_token_id: Mapped[str] = mapped_column(unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow, server_default=func.now())

    user: Mapped["Users"] = relationship("Users", back_populates="refresh_tokens")

class VerifyCodesEnum(str, Enum):
    registration = "registration"
    manage_account = "manage_account"

class VerifyCodes(Base):
    __tablename__ = 'verify_codes'
    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped["VerifyCodesEnum"] = mapped_column(SAEnum(VerifyCodesEnum, name="verify_codes_enum"), nullable=False)
    code: Mapped[int] = mapped_column(unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow, server_default=func.now())

    user: Mapped["Users"] = relationship("Users", back_populates="verify_codes")

class PasswordChangeUrls(Base):
    __tablename__ = 'password_change_urls'
    id: Mapped[int] = mapped_column(primary_key=True)
    url: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete="CASCADE"), nullable=False)


class Profiles(Base):
    __tablename__ = 'profiles'
    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(32), nullable=False)
    last_name: Mapped[str] = mapped_column(String(32), nullable=False)
    birthday: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete="CASCADE"), nullable=False)

    user: Mapped["Users"] = relationship("Users", back_populates="profile")
    avatar: Mapped["Avatars | None"] = relationship("Avatars", back_populates="profile")


class Avatars(Base):
    __tablename__ = 'avatars'
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    profile_id: Mapped[int] = mapped_column(ForeignKey('profiles.id', ondelete="CASCADE"), nullable=False, unique=True)
    uploaded_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow, server_default=func.now())

    profile: Mapped["Profiles"] = relationship("Profiles", back_populates="avatar")

class PostImages(Base):
    __tablename__ = 'post_images'
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    uploaded_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow, server_default=func.now())
    post_id: Mapped[int] = mapped_column(ForeignKey('posts.id', ondelete="CASCADE"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    post: Mapped["Posts"] = relationship("Posts", back_populates="images")

class Categories(Base):
    __tablename__ = 'categories'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(32), nullable=False)
    emoji: Mapped[str] = mapped_column(String(8), nullable=True)
    description: Mapped[str] = mapped_column(String(256), nullable=True)

    posts: Mapped["Posts"] = relationship("Posts", back_populates="category")

class Posts(Base):
    __tablename__ = 'posts'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id', ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=datetime.datetime.utcnow, nullable=False)
    views: Mapped[int] = mapped_column(default=0, nullable=False)
    rating: Mapped[int] = mapped_column(default=0, nullable=False)

    user: Mapped["Users"] = relationship("Users", back_populates="posts")
    category: Mapped["Categories"] = relationship("Categories", back_populates="posts")
    comments: Mapped[list["Comments"]] = relationship("Comments", back_populates="post", cascade="all, delete-orphan")
    reactions: Mapped[list["Reactions"]] = relationship("Reactions", back_populates="post", cascade="all, delete-orphan")
    images: Mapped["PostImages"] = relationship("PostImages", back_populates="post")

class Comments(Base):
    __tablename__ = 'comments'
    id: Mapped[int] = mapped_column(primary_key=True)
    content: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    post_id: Mapped[int] = mapped_column(ForeignKey('posts.id', ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow, server_default=func.now(), nullable=False)

    post: Mapped["Posts"] = relationship("Posts", back_populates="comments")
    user: Mapped["Users"] = relationship("Users", back_populates="comments")

class ReactionsEnum(str, Enum):
    CLOWN = "clown"
    LIKE = "like"
    DISLIKE = "dislike"
    SMILE = "smile"
    LAUGH = "laugh"
    ANGRY = "angry"
    SAD = "sad"
    FIRE = "fire"

class Reactions(Base):
    __tablename__ = 'reactions'
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "post_id",
            name="uq_user_post_reaction"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    reaction: Mapped["ReactionsEnum"] = mapped_column(SAEnum(ReactionsEnum, name="reactions_enum_val"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    post_id: Mapped[int] = mapped_column(ForeignKey('posts.id', ondelete="CASCADE"), nullable=False)

    post: Mapped["Posts"] = relationship("Posts", back_populates="reactions")
    user: Mapped["Users"] = relationship("Users", back_populates="reactions")

class Notifications(Base):
    __tablename__ = 'notifications'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    refer_to: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow, server_default=func.now())

    notifications_list: Mapped["NotificationsList"] = relationship("NotificationsList", back_populates="notification")

class NotificationsStatus(str, Enum):
    unread = "unread"
    read = "read"

class NotificationsList(Base):
    __tablename__ = 'notifications_list'
    id: Mapped[int] = mapped_column(primary_key=True)
    notification_id: Mapped[int] = mapped_column(ForeignKey('notifications.id', ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    status: Mapped[NotificationsStatus] = mapped_column(SAEnum(NotificationsStatus), default=NotificationsStatus.unread, nullable=False)

    notification: Mapped["Notifications"] = relationship("Notifications", back_populates="notifications_list")

class WelcomeNotifications(Base):
    __tablename__ = 'welcome_notifications'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(String(255), nullable=False)
    refer_to: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

class Chats(Base):
    __tablename__ = 'chats'
    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    last_message_id: Mapped[int | None] = mapped_column(ForeignKey('messages.id', ondelete="SET NULL"), nullable=True)
    last_message_text: Mapped[str| None] = mapped_column(Text, nullable=True)
    last_message_created_at: Mapped[datetime.datetime | None] = mapped_column(nullable=True)

    messages: Mapped[list["Messages"]] = relationship("Messages", back_populates="chat", foreign_keys="Messages.chat_id")
    participants: Mapped[list["ChatParticipants"]] = relationship("ChatParticipants", back_populates="chat")
    last_message: Mapped["Messages | None"] = relationship("Messages", foreign_keys=[last_message_id], post_update=True)

class ChatParticipants(Base):
    __tablename__ = 'chat_participants'
    __table_args__ = (
        UniqueConstraint("chat_id", "user_id"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    chat_id: Mapped[int] = mapped_column(ForeignKey('chats.id'), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    username: Mapped[str] = mapped_column(String(64), nullable=False)
    last_read_message_id: Mapped[int | None] = mapped_column(ForeignKey("messages.id"), nullable=True)

    chat: Mapped["Chats"] = relationship("Chats", back_populates="participants")

class Messages(Base):
    __tablename__ = 'messages'
    id: Mapped[int] = mapped_column(primary_key=True)
    chat_id: Mapped[int] = mapped_column(ForeignKey('chats.id'), nullable=False)
    message: Mapped[Text] = mapped_column(Text, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)

    chat: Mapped["Chats"] = relationship("Chats", back_populates="messages", foreign_keys=[chat_id])
    user: Mapped["Users"] = relationship("Users", back_populates="messages")

