"""Usuário B nunca pode ler, alterar ou apagar dados do usuário A."""

import uuid
from datetime import date, timedelta

OUTRO_ID = str(uuid.uuid4())


def _item(client, titulo="Item do A", **extra):
    resp = client.post("/items", json={"titulo": titulo, **extra})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _disciplina(client, nome="Cálculo"):
    resp = client.post("/disciplinas", json={"nome": nome})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _projeto(client, titulo="Projeto A"):
    resp = client.post("/api/projetos", json={"titulo": titulo})
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_item_get_patch_delete_de_outro_usuario_retorna_404(client, client_b):
    item = _item(client)
    assert client_b.get(f"/items/{item['id']}").status_code == 404
    assert client_b.patch(f"/items/{item['id']}", json={"titulo": "invadido"}).status_code == 404
    assert client_b.delete(f"/items/{item['id']}").status_code == 404
    assert client.get(f"/items/{item['id']}").json()["titulo"] == "Item do A"


def test_listagem_de_items_so_mostra_os_proprios(client, client_b):
    _item(client)
    assert client_b.get("/items").json() == []
    assert len(client.get("/items").json()) == 1


def test_titulo_duplicado_vale_apenas_dentro_do_mesmo_usuario(client, client_b):
    _item(client, "Mesmo título")
    assert client_b.post("/items", json={"titulo": "Mesmo título"}).status_code == 201


def test_item_nao_pode_usar_disciplina_ou_projeto_de_outro_usuario(client, client_b):
    disciplina = _disciplina(client)
    projeto = _projeto(client)
    assert client_b.post("/items", json={"titulo": "x", "disciplina_id": disciplina["id"]}).status_code == 422
    assert client_b.post("/items", json={"titulo": "y", "projeto_id": projeto["id"]}).status_code == 422
    proprio = _item(client_b, "do B")
    assert client_b.patch(f"/items/{proprio['id']}", json={"disciplina_id": disciplina["id"]}).status_code == 422
    assert client_b.patch(f"/items/{proprio['id']}", json={"projeto_id": projeto["id"]}).status_code == 422


def test_semana_por_disciplina_e_fechar_dia_nao_vazam(client, client_b):
    disciplina = _disciplina(client)
    prazo = (date.today() + timedelta(days=0)).isoformat() + "T12:00:00"
    _item(client, "prova", tipo="tarefa", tempo_estimado="1h", disciplina_id=disciplina["id"], prazo=prazo)
    assert client_b.get("/items/semana-por-disciplina").json() == {}
    resp = client_b.post("/items/fechar-dia")
    assert resp.json()["itens_reagendados"] == 0
    assert client.get(f"/items?disciplina_id={disciplina['id']}").json()[0]["prazo"].startswith(prazo[:10])


def test_disciplina_de_outro_usuario(client, client_b):
    d = _disciplina(client)
    assert client_b.get("/disciplinas").json() == []
    assert client_b.get(f"/disciplinas/{d['id']}").status_code == 404
    assert client_b.patch(f"/disciplinas/{d['id']}", json={"nome": "x"}).status_code == 404
    assert client_b.delete(f"/disciplinas/{d['id']}").status_code == 404
    assert client.get(f"/disciplinas/{d['id']}").status_code == 200


def test_projeto_de_outro_usuario(client, client_b):
    p = _projeto(client)
    assert client_b.get("/api/projetos").json() == []
    assert client_b.get(f"/api/projetos/{p['id']}").status_code == 404
    assert client_b.patch(f"/api/projetos/{p['id']}", json={"titulo": "x"}).status_code == 404
    assert client_b.delete(f"/api/projetos/{p['id']}").status_code == 404


def test_subtarefas_de_outro_usuario(client, client_b):
    item = _item(client)
    sub = client.post(f"/items/{item['id']}/checklist", json={"titulo": "sub"}).json()
    assert client_b.post(f"/items/{item['id']}/checklist", json={"titulo": "x"}).status_code == 404
    assert client_b.get(f"/items/{item['id']}/checklist").status_code == 404
    assert client_b.patch(f"/checklist/{sub['id']}", json={"concluido": True}).status_code == 404
    assert client_b.delete(f"/checklist/{sub['id']}").status_code == 404
    client.patch(f"/checklist/{sub['id']}", json={"concluido": True})
    assert client_b.get("/checklist/concluidos").json() == []
    assert len(client.get("/checklist/concluidos").json()) == 1


def test_checklist_diaria_de_outro_usuario(client, client_b):
    item = client.post("/api/dashboard/checklist-items", json={"titulo": "creatina"}).json()
    hoje = date.today().isoformat()
    assert client.post(f"/api/dashboard/checklist/{item['id']}/toggle", json={"data": hoje}).status_code == 200

    assert client_b.get("/api/dashboard/checklist-items").json() == []
    assert client_b.patch(f"/api/dashboard/checklist-items/{item['id']}", json={"titulo": "x"}).status_code == 404
    assert client_b.post(f"/api/dashboard/checklist/{item['id']}/toggle", json={"data": hoje}).status_code == 404
    assert client_b.get("/api/dashboard/checklist").json()["linhas"] == []
    assert all(p["total_feitos"] == 0 for p in client_b.get("/api/dashboard/checklist/grafico").json())
    assert client_b.get("/api/dashboard/resumo").json()["hoje"]["checklist_feitos"] == 0
    assert client.get("/api/dashboard/resumo").json()["hoje"]["checklist_feitos"] == 1


def test_agenda_e_concluir_de_outro_usuario(client, client_b):
    item = _item(client, "foco", foco_hoje=True)
    assert len(client.get("/api/dashboard/agenda").json()) == 1
    assert client_b.get("/api/dashboard/agenda").json() == []
    assert client_b.post(f"/api/dashboard/agenda/{item['id']}/concluir").status_code == 404
    assert client.get(f"/items/{item['id']}").json()["status"] != "feito"


def test_frases_sao_por_usuario(client, client_b):
    quote = client.post("/api/dashboard/quotes", json={"texto": "frase do A"}).json()
    client.post("/api/dashboard/quotes/amanha", json={"texto": "amanhã do A"})
    assert client_b.get("/api/dashboard/quotes").json() == []
    assert client_b.get("/api/dashboard/quote").json() is None
    assert client_b.delete(f"/api/dashboard/quotes/{quote['id']}").status_code == 404
    client_b.post("/api/dashboard/quotes/amanha", json={"texto": "amanhã do B"})
    textos_a = [q["texto"] for q in client.get("/api/dashboard/quotes").json()]
    assert sorted(textos_a) == ["amanhã do A", "frase do A"]


def test_push_subscription_muda_de_dono_ao_reinscrever(client, client_b, db_session):
    from app.models.push_model import PushSubscription

    corpo = {"endpoint": "https://push.exemplo/abc", "keys": {"p256dh": "k", "auth": "a"}}
    assert client.post("/push/subscribe", json=corpo).status_code == 201
    assert client_b.post("/push/unsubscribe", json={"endpoint": corpo["endpoint"]}).status_code == 204
    assert db_session.query(PushSubscription).count() == 1  # B não apaga a inscrição de A

    assert client_b.post("/push/subscribe", json=corpo).status_code == 201
    assert db_session.query(PushSubscription).count() == 1
    sub = db_session.query(PushSubscription).one()
    me_b = client_b.get("/auth/me").json()["id"]
    assert str(sub.user_id) == me_b
