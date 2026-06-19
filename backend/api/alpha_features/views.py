from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocket

from api.auth.dependencies import get_auth

alpha = APIRouter(prefix="/alpha", tags=["alpha"])

@alpha.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, session: AsyncSession = Depends(get_auth)):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
    try:
        user = await get_auth(token=token, session=session)
    except Exception:
        await websocket.close(code=1008)

    try:
        while True:
            pass


    except Exception:
        await websocket.close(code=1008)
