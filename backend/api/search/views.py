from fastapi import APIRouter
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.search.utils import get_search
from src.models.database import get_session

search_router = APIRouter(prefix="/search", tags=["search"])

@search_router.get("/{query}")
async def search(query: str | None, session: AsyncSession = Depends(get_session)):
    return await get_search(query, session)