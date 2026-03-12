from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth
from api.auth.schemas import UserOut
from api.posts_rating.utils import update_posts_rating_by_post_id
from api.reactions.crud import post_reaction_for_current_user, get_reactions_by_id
from api.reactions.dto import get_reactions_by_post_id_dto
from api.reactions.schemas import ReactionsEnum, Reaction, ReactionEmojis
from src.models.database import get_session

reaction_router = APIRouter(prefix="/reactions", tags=["Reactions"])


@reaction_router.get("/reaction_types/")
async def get_reaction_types():
    response = ReactionEmojis().emojis
    return response

@reaction_router.post("/")
async def reaction_react(post_id: int, reaction: ReactionsEnum, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    await post_reaction_for_current_user(user_id=user.id, post_id=post_id, reaction=reaction, session=session)
    await update_posts_rating_by_post_id(post_id=post_id, session=session)
    return {"status": "success"}

@reaction_router.get("/{post_id}/")
async def get_reactions_by_post_id(post_id: int, session: AsyncSession = Depends(get_session)):
    res = await get_reactions_by_id(post_id=post_id, session=session)
    return get_reactions_by_post_id_dto(res)
