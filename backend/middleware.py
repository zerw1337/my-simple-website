from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from api.rate_limiter.limiter import is_limited

def get_current_ip_address(request: Request) -> str:
    ip = request.client.host
    return ip

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ip = get_current_ip_address(request)
        if await is_limited(ip):
            return JSONResponse(
                status_code=429,
                content={"message": "Too Many Requests"},
            )

        return await call_next(request)

