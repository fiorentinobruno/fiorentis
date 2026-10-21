import hmac

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_senha, verificar_senha
from app.models.user_model import User
from app.schemas.auth_schema import LoginRequest, RegisterRequest

# prefixo do hash das contas criadas pela migration, que ainda não têm senha
SEM_SENHA = "!"

# hash de uma senha qualquer, usado para gastar o mesmo tempo quando o email não existe
_HASH_FALSO = hash_senha("senha-falsa-para-igualar-tempo")


class CodigoAcessoInvalidoError(Exception):
    pass


class EmailJaCadastradoError(Exception):
    pass


def _codigo_valido(informado: str | None) -> bool:
    esperado = settings.app_password
    if not esperado:
        return True
    return hmac.compare_digest((informado or "").encode("utf-8"), esperado.encode("utf-8"))


def register(db: Session, data: RegisterRequest) -> User:
    if not _codigo_valido(data.codigo_acesso):
        raise CodigoAcessoInvalidoError()
    existente = db.query(User).filter(User.email == data.email).first()
    if existente is not None:
        if existente.password_hash.startswith(SEM_SENHA):
            # conta "dono" criada pela migration: o primeiro cadastro com este email define a senha
            existente.password_hash = hash_senha(data.senha)
            db.commit()
            db.refresh(existente)
            return existente
        raise EmailJaCadastradoError()

    user = User(email=data.email, password_hash=hash_senha(data.senha))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, data: LoginRequest) -> User | None:
    user = db.query(User).filter(User.email == data.email).first()
    if user is None:
        verificar_senha(data.senha, _HASH_FALSO)
        return None
    if not verificar_senha(data.senha, user.password_hash):
        return None
    return user
