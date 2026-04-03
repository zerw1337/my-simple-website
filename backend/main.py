from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
import uvicorn
from starlette.middleware.cors import CORSMiddleware

from api.categories.views import cat_router
from src.models.database import db_dispose
from api.auth.schemas import UserOut
from api.auth.dependencies import get_auth
from src.redis import redis_config

from api.reactions.views import reaction_router
from api.users.views import users_router
from api.auth.views import auth_router
from api.registration.views import register_router
from api.profiles.views import profiles_router
from api.posts.views import posts_router
from api.comments.views import comments_router
from middleware import RateLimitMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):

    await redis_config.init_redis()

    yield
    
    await db_dispose()
    await redis_config.close_redis()


app = FastAPI(lifespan=lifespan)

app.include_router(reaction_router)
app.include_router(comments_router)
app.include_router(posts_router)
app.include_router(profiles_router)
app.include_router(register_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(cat_router)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(CORSMiddleware,
                   allow_origins=[
                       "http://localhost:5173",
                       "http://127.0.0.1:5173",
                       "http://frontend:5173",
                   ],
                    allow_credentials=True,
                    allow_methods=["*"],
                    allow_headers=["*"],
                   )


@app.get('/')
async def root(user: UserOut = Depends(get_auth)):
    return {'message': f'Hello {user.username}'}



if __name__ == "__main__":
    uvicorn.run("main:app", reload=False, host="0.0.0.0")



