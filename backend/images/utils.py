import io

from PIL import Image
from fastapi import UploadFile, HTTPException

from src.config import settings


def validate_image(file: UploadFile) -> None:
    if file.content_type not in settings.ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type")

    if "." not in file.filename:
        raise HTTPException(status_code=400, detail="Missing file extension")

    ext = file.filename.rsplit(".", 1)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file extension")

    try:
        contents = file.file.read()
        Image.open(io.BytesIO(contents)).verify()
        file.file.seek(0)
    except Exception:
        raise HTTPException(status_code=400, detail="Corrupted or fake image")

    contents = file.file.read()

    if len(contents) > settings.MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large")

    file.file.seek(0)

    return
