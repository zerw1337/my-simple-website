from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import json
from redis.asyncio import Redis

from api.auth.dependencies import get_auth
from api.auth.schemas import UserOut
from api.posts_rating.utils import update_posts_rating_by_post_id
from api.reactions.crud import post_reaction_for_current_user, get_reactions_by_id
from api.reactions.dto import get_reactions_by_post_id_dto
from api.reactions.schemas import ReactionsEnum, Reaction, ReactionEmojis
from src.models.database import get_session
from src.redis.dependencies import get_cache
from api.rate_limiter.limiter import is_limited_reactions

reaction_router = APIRouter(prefix="/reactions", tags=["Reactions"])


@reaction_router.get("/reaction_types/", summary="GET Все типы реакций")
async def get_reaction_types(r: Redis = Depends(get_cache)):
    cached = await r.get("reaction_types")
    if cached:
        return json.loads(cached)
    response = ReactionEmojis().emojis
    await r.set("reaction_types", json.dumps(response))
    return response

@reaction_router.post("/", summary="POST реакции по post_id")
async def reaction_react(post_id: int, reaction: ReactionsEnum, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    if await is_limited_reactions(user_id=user.id):
        raise HTTPException(status_code=429, detail="Your reaction limit per day has been reached")
    await post_reaction_for_current_user(user_id=user.id, post_id=post_id, reaction=reaction, session=session)
    await update_posts_rating_by_post_id(post_id=post_id, session=session)
    return {"status": "success"}

@reaction_router.get("/{post_id}/", response_model=list[Reaction], summary="GET реакции по post_id")
async def get_reactions_by_post_id(post_id: int, session: AsyncSession = Depends(get_session)):
    res = await get_reactions_by_id(post_id=post_id, session=session)
    res_dto = get_reactions_by_post_id_dto(res)
    return res_dto
