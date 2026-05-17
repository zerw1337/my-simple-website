import uuid
from fastapi import UploadFile


class MinioService:
    def __init__(self, client, bucket: str):
        self.client = client
        self.bucket = bucket

    async def upload_file(self, file: UploadFile, content_type: str):
        key = f"{uuid.uuid4()}"

        await self.client.upload_fileobj(
            file.file,
            Bucket=self.bucket,
            Key=key,
            ExtraArgs={
                "ContentType": content_type,
            }
        )
        return key

    async def delete_file(self, key: str):
        await self.client.delete_object(
            Bucket=self.bucket,
            Key=key
        )

    async def get_file(self, key: str):
        return await self.client.get_object(
            Bucket=self.bucket,
            Key=key
        )