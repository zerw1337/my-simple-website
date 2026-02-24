from datetime import datetime
from pydantic import BaseModel, ConfigDict



class TokenFields(BaseModel):
    TOKEN_TYPE_FIELD: str = 'type'
    ACCESS_TOKEN_FIELD: str = 'access'
    REFRESH_TOKEN_FIELD: str = 'refresh'

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"

class RefreshToken(BaseModel):
    refresh_token: str
    token_type: str = "Bearer"

class AccessToken(BaseModel):
    access_token: str
    token_type: str = "Bearer"

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    is_active: bool
    is_banned: bool
    user_version: int

    model_config = ConfigDict(from_attributes=True)

token_fields = TokenFields()