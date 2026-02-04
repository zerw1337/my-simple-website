from sqlalchemy import text
from src.database import async_session_factory

async def test():
    async with async_session_factory() as session:
        res = await session.execute(text("SELECT VERSION()"))
        return res.all()