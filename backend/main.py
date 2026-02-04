import asyncio
from src.query import test


# app = FastAPI()
#
# app.mount("/static", StaticFiles(directory="static"), name="static")
# templates = Jinja2Templates(directory="Templates")
#
# @app.get("/", response_class=HTMLResponse, summary="index.html")
# async def home(request: Request):
#     return templates.TemplateResponse("index.html", {"request": request})
#
# if __name__ == "__main__":
#     uvicorn.run("main:app", reload=True)

res = asyncio.run(test())
print(res)

