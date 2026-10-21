from app.core.config import settings


def test_registrar_e_acessar_me(anon_client):
    resp = anon_client.post("/auth/register", json={"email": "Novo@Exemplo.com", "senha": "12345678"})
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    me = anon_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "novo@exemplo.com"


def test_email_duplicado_retorna_409(anon_client):
    dados = {"email": "dup@exemplo.com", "senha": "12345678"}
    assert anon_client.post("/auth/register", json=dados).status_code == 201
    outro_case = {"email": "DUP@exemplo.com", "senha": "12345678"}
    assert anon_client.post("/auth/register", json=outro_case).status_code == 409


def test_senha_curta_ou_longa_demais_retorna_422(anon_client):
    assert anon_client.post("/auth/register", json={"email": "x@exemplo.com", "senha": "123"}).status_code == 422
    longa = "a" * 73
    assert anon_client.post("/auth/register", json={"email": "x@exemplo.com", "senha": longa}).status_code == 422


def test_login_correto_e_incorreto(anon_client):
    anon_client.post("/auth/register", json={"email": "l@exemplo.com", "senha": "12345678"})
    ok = anon_client.post("/auth/login", json={"email": "l@exemplo.com", "senha": "12345678"})
    assert ok.status_code == 200
    assert ok.json()["token_type"] == "bearer"
    errada = anon_client.post("/auth/login", json={"email": "l@exemplo.com", "senha": "outra-senha"})
    inexistente = anon_client.post("/auth/login", json={"email": "z@exemplo.com", "senha": "12345678"})
    assert errada.status_code == inexistente.status_code == 401
    assert errada.json() == inexistente.json()


def test_codigo_de_acesso_exigido_quando_configurado(anon_client, monkeypatch):
    monkeypatch.setattr(settings, "app_password", "segredo")
    base = {"email": "c@exemplo.com", "senha": "12345678"}
    assert anon_client.post("/auth/register", json=base).status_code == 403
    assert anon_client.post("/auth/register", json={**base, "codigo_acesso": "errado"}).status_code == 403
    assert anon_client.post("/auth/register", json={**base, "codigo_acesso": "segredo"}).status_code == 201


def test_rotas_protegidas_exigem_token(anon_client):
    for caminho in ("/items", "/disciplinas", "/api/projetos", "/api/dashboard/resumo", "/checklist/concluidos"):
        assert anon_client.get(caminho).status_code == 401, caminho
    assert anon_client.get("/items", headers={"Authorization": "Bearer lixo"}).status_code == 401


def test_rotas_publicas_continuam_abertas(anon_client):
    assert anon_client.get("/health").status_code == 200
    assert anon_client.get("/health/db").status_code == 200
    assert anon_client.get("/login").status_code == 200
    assert anon_client.get("/push/public-key").status_code == 200


def test_conta_dono_da_migration_pode_ser_reivindicada_uma_vez(anon_client, db_session):
    from app.models.user_model import User

    db_session.add(User(email="dono@exemplo.com", password_hash="!sem-senha"))
    db_session.commit()
    dados = {"email": "dono@exemplo.com", "senha": "minha-senha-1"}
    assert anon_client.post("/auth/login", json=dados).status_code == 401
    assert anon_client.post("/auth/register", json=dados).status_code == 201
    assert anon_client.post("/auth/login", json=dados).status_code == 200
    assert anon_client.post("/auth/register", json={**dados, "senha": "outra-senha-9"}).status_code == 409


def test_email_placeholder_do_dono_e_aceito(anon_client):
    resp = anon_client.post(
        "/auth/register", json={"email": "dono@fiorentis.local", "senha": "12345678"}
    )
    assert resp.status_code == 201


def test_respostas_json_nao_sao_cacheaveis(client):
    assert client.get("/disciplinas").headers["cache-control"] == "no-store"
    assert "cache-control" not in client.get("/login").headers
