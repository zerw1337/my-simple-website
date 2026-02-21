from pydantic import BaseModel



class TokenFields(BaseModel):
    TOKEN_TYPE_FIELD: str = 'type'
    ACCESS_TOKEN_FIELD: str = 'access'
    REFRESH_TOKEN_FIELD: str = 'refresh'

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"

token_fields = TokenFields()