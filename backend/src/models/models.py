from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey, text, func, DateTime, UniqueConstraint, Enum as SAEnum
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
    pending_email: Mapped[str] = mapped_column(String(64), unique=True, nullable=True)

    refresh_tokens: Mapped["RefreshTokens"] = relationship("RefreshTokens", back_populates="user", cascade="all, delete-orphan")
    profile: Mapped["Profiles"] = relationship("Profiles" ,back_populates="user", uselist=False, cascade="all, delete-orphan")
    posts: Mapped["Posts"] = relationship("Posts", back_populates="user", cascade="all, delete-orphan")
    comments: Mapped[list["Comments"]] = relationship("Comments", back_populates="user", cascade="all, delete-orphan")



class RefreshTokens(Base):
    __tablename__ = 'refresh_tokens'

    id: Mapped[int] = mapped_column(primary_key=True)
    refresh_token_id: Mapped[str] = mapped_column(unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
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
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow, server_default=func.now())


class Profiles(Base):
    __tablename__ = 'profiles'
    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(32), nullable=False)
    last_name: Mapped[str] = mapped_column(String(32), nullable=False)
    birthday: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)

    user: Mapped["Users"] = relationship("Users", back_populates="profile")

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
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id'), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=datetime.datetime.utcnow, nullable=False)

    user: Mapped["Users"] = relationship("Users", back_populates="posts")
    category: Mapped["Categories"] = relationship("Categories", back_populates="posts")
    comments: Mapped[list["Comments"]] = relationship("Comments", back_populates="post")
    reactions: Mapped["Reactions"] = relationship("Reactions", back_populates="post")

class Comments(Base):
    __tablename__ = 'comments'
    id: Mapped[int] = mapped_column(primary_key=True)
    content: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    post_id: Mapped[int] = mapped_column(ForeignKey('posts.id'), nullable=False)
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
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    post_id: Mapped[int] = mapped_column(ForeignKey('posts.id'), nullable=False)

    post: Mapped["Posts"] = relationship("Posts", back_populates="reactions")