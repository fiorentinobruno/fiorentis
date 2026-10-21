from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import ler_token
from app.db.dependencies import get_db
from app.models.user_model import User

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    erro = HTTPException(
        status_code=401, detail="Não autenticado", headers={"WWW-Authenticate": "Bearer"}
    )
    if credenciais is None:
        raise erro
    user_id = ler_token(credenciais.credentials)
    if user_id is None:
        raise erro
    user = db.get(User, user_id)
    if user is None:
        raise erro
    return user
