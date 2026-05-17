import aioboto3
from botocore.exceptions import ClientError


from src.config import settings

session = aioboto3.Session()

async def get_minio():
    async with session.client(
        service_name="s3",
        endpoint_url=settings.MINIO_URL,
        aws_access_key_id=settings.MINIO_ROOT_USER,
        aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
        region_name=settings.MINIO_REGION,
    ) as client:
        yield client

async def minio_bucket_setup():
    buckets = [
        settings.MINIO_BUCKET_IMAGES,
        settings.MINIO_BUCKET_VIDEOS,
        settings.MINIO_BUCKET_AVATARS,
    ]

    async with session.client(
            service_name="s3",
            endpoint_url=settings.MINIO_URL,
            aws_access_key_id=settings.MINIO_ROOT_USER,
            aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
            region_name=settings.MINIO_REGION,
    ) as minio:

        for bucket in buckets:
            try:
                await minio.head_bucket(Bucket=bucket)
            except ClientError:
                await minio.create_bucket(Bucket=bucket)