from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth
from api.auth.schemas import UserOut
from api.reactions.crud import post_reaction_for_current_user, get_reactions_by_id
from api.reactions.dto import get_reactions_by_post_id_dto
from api.reactions.schemas import ReactionsEnum, Reaction, ReactionEmojis
from src.models.database import get_session

reaction_router = APIRouter(prefix="/reactions", tags=["Reactions"])

@reaction_router.post("/")
async def reaction_react(post_id: int, reaction: ReactionsEnum, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await post_reaction_for_current_user(user_id=user.id, post_id=post_id, reaction=reaction, session=session)

@reaction_router.get("/{post_id}/", response_model=list[Reaction])
async def get_reactions_by_post_id(post_id: int, session: AsyncSession = Depends(get_session)):
    reactions_orm = await get_reactions_by_id(post_id=post_id, session=session)
    return get_reactions_by_post_id_dto(reactions_orm=reactions_orm)

@reaction_router.get("/reaction_types/")
async def get_reaction_types():
    response = ReactionEmojis().emojis
    return response