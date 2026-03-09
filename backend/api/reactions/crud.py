from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from typing import Sequence

from src.models.models import ReactionsEnum, Reactions


async def post_reaction_for_current_user(user_id: int, post_id: int, reaction: ReactionsEnum, session: AsyncSession):
    query = (
        select(Reactions)
        .where(Reactions.user_id == user_id, Reactions.post_id == post_id)
    )
    res = await session.execute(query)
    existing = res.scalar_one_or_none()
    try:
        if existing is None:
            session.add(Reactions(reaction=reaction, user_id=user_id, post_id=post_id))
        elif existing.reaction == reaction:
            await session.delete(existing)
        else:
            existing.reaction = reaction
        await session.commit()
    except Exception:
        await session.rollback()
        raise HTTPException(status_code=403, detail="Something went wrong")
    return {"success": True}


async def get_reactions_by_id(post_id: int, session: AsyncSession) -> Sequence[Reactions]:
    query = select(Reactions).where(Reactions.post_id == post_id)
    res = await session.execute(query)
    return res.scalars().all()