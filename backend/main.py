from fastapi import FastAPI, APIRouter
from contextlib import asynccontextmanager
import uvicorn

from src.models.database import db
from src.models.models import *
from api.registration.views import register_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with db.async_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(register_router)

@app.get('/')
async def root():
    return {'message': 'Hello World'}



if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)



