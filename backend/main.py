from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
import uvicorn

from src.models.models import *
from src.models.database import db
from api.registration.views import register_router
from api.auth.views import auth_router
from api.auth.schemas import UserOut
from api.auth.dependencies import get_auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with db.async_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(register_router)
app.include_router(auth_router)

@app.get('/')
async def root(user: UserOut = Depends(get_auth)):
    return {'message': f'Hello {user.username}'}



if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)



