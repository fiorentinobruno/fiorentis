"""Define (ou cria) a senha de um usuário.

Uso: uv run python -m scripts.definir_senha <email> <nova-senha>
Útil para o usuário "dono" criado pela migration, que começa sem senha.
"""
import sys

from app.core.security import hash_senha
from app.db.session import SessionLocal
from app.models.user_model import User


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("uso: python -m scripts.definir_senha <email> <nova-senha>")
    email, senha = sys.argv[1].strip().lower(), sys.argv[2]
    if not 8 <= len(senha) <= 72:
        raise SystemExit("a senha deve ter entre 8 e 72 caracteres")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(email=email, password_hash=hash_senha(senha))
            db.add(user)
            print(f"usuário criado: {email}")
        else:
            user.password_hash = hash_senha(senha)
            print(f"senha atualizada: {email}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
