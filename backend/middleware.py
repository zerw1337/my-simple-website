from fastapi import Request

async def get_current_ip_address(request: Request) -> str:
    ip = request.client.host
    return ip