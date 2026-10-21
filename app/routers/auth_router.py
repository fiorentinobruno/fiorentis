from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.security import criar_token
from app.db.dependencies import get_db
from app.models.user_model import User
from app.schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse, UserRead
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        user = auth_service.register(db, data)
    except auth_service.CodigoAcessoInvalidoError as exc:
        raise HTTPException(status_code=403, detail="Código de acesso inválido") from exc
    except auth_service.EmailJaCadastradoError as exc:
        raise HTTPException(status_code=409, detail="Email já cadastrado") from exc
    return TokenResponse(access_token=criar_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.authenticate(db, data)
    if user is None:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    return TokenResponse(access_token=criar_token(user.id))


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)) -> User:
    return user
