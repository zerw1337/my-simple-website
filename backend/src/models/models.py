from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey, text, func, DateTime, UniqueConstraint
import datetime
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

    refresh_tokens: Mapped["RefreshTokens"] = relationship(back_populates="user")
    profile: Mapped["Profiles"] = relationship(back_populates="user", uselist=False)
    posts: Mapped["Posts"] = relationship(back_populates="user")



class RefreshTokens(Base):
    __tablename__ = 'refresh_tokens'

    id: Mapped[int] = mapped_column(primary_key=True)
    refresh_token_id: Mapped[str] = mapped_column(unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow, server_default=func.now())

    user: Mapped["Users"] = relationship(Users, back_populates="refresh_tokens")



class Profiles(Base):
    __tablename__ = 'profiles'
    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(32), nullable=False)
    last_name: Mapped[str] = mapped_column(String(32), nullable=False)
    birthday: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)

    user: Mapped["Users"] = relationship(back_populates="profile")

class Categories(Base):
    __tablename__ = 'categories'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(32), nullable=False)
    emoji: Mapped[str] = mapped_column(String(8), nullable=True)
    description: Mapped[str] = mapped_column(String(256), nullable=True)

class Posts(Base):
    __tablename__ = 'posts'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id'), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=datetime.datetime.utcnow, nullable=False)

    user: Mapped["Users"] = relationship(back_populates="posts")
