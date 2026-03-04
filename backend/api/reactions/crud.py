from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from typing import Sequence

from src.models.models import ReactionsEnum, Reactions


async def post_reaction_for_current_user(user_id: int, post_id: int, reaction: ReactionsEnum, session: AsyncSession):
    new_reaction = Reactions(
        reaction=reaction,
        user_id=user_id,
        post_id=post_id
    )
    session.add(new_reaction)
    try:
        await session.commit()
    except Exception:
        await session.rollback()
        raise HTTPException(status_code=403, detail="Something went wrong")
    return {"success": True}

async def get_reactions_by_id(post_id: int, session: AsyncSession) -> Sequence[Reactions]:
    query = (
        select(Reactions)
        .where(Reactions.post_id == post_id)
    )
    res = await session.execute(query)
    result = res.scalars().all()
    if not result:
        raise HTTPException(status_code=404, detail="Reaction not found")
    return result