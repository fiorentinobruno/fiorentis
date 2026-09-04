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
