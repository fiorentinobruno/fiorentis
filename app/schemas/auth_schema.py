import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class _EmailNormalizado(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def _minusculo(cls, valor: str) -> str:
        return valor.strip().lower()


class RegisterRequest(_EmailNormalizado):
    # bcrypt só considera os primeiros 72 bytes; o limite evita senhas truncadas em silêncio
    senha: str = Field(min_length=8, max_length=72)
    codigo_acesso: str | None = Field(default=None, max_length=200)


class LoginRequest(_EmailNormalizado):
    senha: str = Field(max_length=200)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
