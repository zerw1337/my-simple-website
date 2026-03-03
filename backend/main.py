from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
import uvicorn

from api.categories.views import cat_router
from src.models.database import db_dispose
from api.auth.schemas import UserOut
from api.auth.dependencies import get_auth

from api.users.views import users_router
from api.auth.views import auth_router
from api.registration.views import register_router
from api.profiles.views import profiles_router
from api.posts.views import posts_router

@asynccontextmanager
async def lifespan(app: FastAPI):

    yield
    await db_dispose()

app = FastAPI(lifespan=lifespan)

app.include_router(posts_router)
app.include_router(profiles_router)
app.include_router(register_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(cat_router)


@app.get('/')
async def root(user: UserOut = Depends(get_auth)):
    return {'message': f'Hello {user.username}'}



if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)



