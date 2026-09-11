def test_resumo_estrutura_basica(client):
    resp = client.get("/api/dashboard/resumo")
    assert resp.status_code == 200
    data = resp.json()
    for periodo in ("hoje", "semana"):
        assert periodo in data
        assert set(data[periodo].keys()) >= {
            "tarefas_feitas",
            "tarefas_pendentes",
            "eventos",
            "checklist_feitos",
            "checklist_total",
        }


def test_resumo_conta_tarefa_com_foco_hoje(client):
    client.post(
        "/items",
        json={"titulo": "Tarefa de hoje", "tipo": "tarefa", "tempo_estimado": "30min", "foco_hoje": True},
    )
    resp = client.get("/api/dashboard/resumo")
    assert resp.json()["hoje"]["tarefas_pendentes"] >= 1


def test_agenda_hoje_ignora_tarefa_com_data_inicio_futura(client):
    from datetime import datetime, timedelta

    amanha = (datetime.now() + timedelta(days=1)).isoformat()
    client.post(
        "/items",
        json={
            "titulo": "Tarefa agendada pra amanhã",
            "tipo": "tarefa",
            "tempo_estimado": "30min",
            "prazo": amanha,
            "data_inicio": amanha,
        },
    )
    resp = client.get("/api/dashboard/agenda")
    titulos = [i["titulo"] for i in resp.json()]
    assert "Tarefa agendada pra amanhã" not in titulos


def test_agenda_hoje_mostra_tarefa_com_data_inicio_hoje(client):
    from datetime import datetime

    hoje = datetime.now().isoformat()
    client.post(
        "/items",
        json={
            "titulo": "Tarefa começando hoje na agenda",
            "tipo": "tarefa",
            "tempo_estimado": "30min",
            "data_inicio": hoje,
        },
    )
    resp = client.get("/api/dashboard/agenda")
    titulos = [i["titulo"] for i in resp.json()]
    assert "Tarefa começando hoje na agenda" in titulos
