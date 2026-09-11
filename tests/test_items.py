def test_criar_item_simples(client):
    resp = client.post("/items", json={"titulo": "Comprar leite"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["titulo"] == "Comprar leite"
    assert data["status"] == "inbox"


def test_titulo_duplicado_retorna_409(client):
    client.post("/items", json={"titulo": "Estudar cálculo"})
    resp = client.post("/items", json={"titulo": "Estudar cálculo"})
    assert resp.status_code == 409


def test_tarefa_sem_tempo_estimado_retorna_422(client):
    resp = client.post("/items", json={"titulo": "Fazer prova", "tipo": "tarefa"})
    assert resp.status_code == 422


def test_tarefa_com_tempo_estimado_cria_normalmente(client):
    resp = client.post(
        "/items",
        json={"titulo": "Fazer prova", "tipo": "tarefa", "tempo_estimado": "1h"},
    )
    assert resp.status_code == 201
    assert resp.json()["tempo_estimado"] == "1h"


def test_nota_nao_exige_tempo_estimado(client):
    resp = client.post("/items", json={"titulo": "Lembrete qualquer", "tipo": "nota"})
    assert resp.status_code == 201


def test_editar_item_para_tarefa_sem_tempo_estimado_retorna_422(client):
    criado = client.post("/items", json={"titulo": "Anotação livre"}).json()
    resp = client.patch(f"/items/{criado['id']}", json={"tipo": "tarefa"})
    assert resp.status_code == 422


def test_excluir_item(client):
    criado = client.post("/items", json={"titulo": "Item descartável"}).json()
    resp = client.delete(f"/items/{criado['id']}")
    assert resp.status_code == 204
    assert client.get(f"/items/{criado['id']}").status_code == 404


def _iso(dt):
    return dt.isoformat()


def test_tarefa_com_data_inicio_amanha_nao_aparece_em_hoje_mas_aparece_em_semana(client):
    from datetime import datetime, timedelta

    amanha = datetime.now() + timedelta(days=1)
    client.post(
        "/items",
        json={
            "titulo": "Tarefa de amanhã",
            "tipo": "tarefa",
            "tempo_estimado": "30min",
            "data_inicio": _iso(amanha),
        },
    )
    titulos_hoje = [i["titulo"] for i in client.get("/items?view=hoje").json()]
    titulos_semana = [i["titulo"] for i in client.get("/items?view=semana").json()]
    assert "Tarefa de amanhã" not in titulos_hoje
    assert "Tarefa de amanhã" in titulos_semana


def test_tarefa_com_data_inicio_semana_que_vem_nao_aparece_em_hoje_nem_semana(client):
    from datetime import datetime, timedelta

    daqui_8_dias = datetime.now() + timedelta(days=8)
    client.post(
        "/items",
        json={
            "titulo": "Tarefa da semana que vem",
            "tipo": "tarefa",
            "tempo_estimado": "30min",
            "data_inicio": _iso(daqui_8_dias),
        },
    )
    titulos_hoje = [i["titulo"] for i in client.get("/items?view=hoje").json()]
    titulos_semana = [i["titulo"] for i in client.get("/items?view=semana").json()]
    assert "Tarefa da semana que vem" not in titulos_hoje
    assert "Tarefa da semana que vem" not in titulos_semana


def test_tarefa_com_data_inicio_hoje_aparece_em_hoje_sem_prazo(client):
    from datetime import datetime

    client.post(
        "/items",
        json={
            "titulo": "Tarefa começando hoje",
            "tipo": "tarefa",
            "tempo_estimado": "30min",
            "data_inicio": _iso(datetime.now()),
        },
    )
    titulos_hoje = [i["titulo"] for i in client.get("/items?view=hoje").json()]
    assert "Tarefa começando hoje" in titulos_hoje


def test_tarefa_atrasada_sem_data_inicio_continua_aparecendo_em_hoje(client):
    from datetime import datetime, timedelta

    ontem = datetime.now() - timedelta(days=1)
    client.post(
        "/items",
        json={
            "titulo": "Tarefa atrasada",
            "tipo": "tarefa",
            "tempo_estimado": "30min",
            "prazo": _iso(ontem),
        },
    )
    titulos_hoje = [i["titulo"] for i in client.get("/items?view=hoje").json()]
    assert "Tarefa atrasada" in titulos_hoje
