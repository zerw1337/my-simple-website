from fastapi import FastAPI, APIRouter
from contextlib import asynccontextmanager
import uvicorn

from src.models.database import get_session, db, Base
from src.models.models import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with db.async_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)

@app.get('/')
async def root():
    return {'message': 'Hello World'}



if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)



