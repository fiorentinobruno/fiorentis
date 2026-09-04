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
