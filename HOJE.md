# Plano de hoje — 2026-08-24

## 1. Cron externo pra acordar o Render antes das 8h
- GitHub Actions com `schedule` (cron em UTC) batendo `GET /health` (ou `/`) às 7:55 no horário local.
- Criar `.github/workflows/keep-alive.yml`.
- Checar se já existe endpoint de health check leve; se não, criar um em `app/main.py` ou `app/routers`.

## 2. Checklist diária/semanal — tabela RecurringTemplate
- Nova tabela `RecurringTemplate`: título, área, tipo, recorrência (diário / semanal + dia da semana), status ativo.
- Migration Alembic pra criar a tabela.
- Job no scheduler (`app/services/scheduler.py`) que, na janela certa, gera uma instância de `Item` a partir de cada template ativo (mantendo histórico das ocorrências passadas).
- Definir onde essa checklist aparece na UI (aba nova? dentro de "Hoje"?) — a confirmar com o Bruno durante a implementação.

## 3. Não duplicar todos com mesmo título
- Em `item_service.create_item`: checar título igual (case-insensitive) entre itens com `status != arquivado`.
- Se encontrar, retornar erro 409 no router (`app/routers/item_router.py`).
- Frontend (`static/todos.js` ou `shared.js`) trata o 409 e mostra aviso pro usuário.

## 4. Paleta preto/branco + roxo #561394
- Aplicada junto com o resto hoje.
- Levantar onde está o CSS hoje (inline nos `.html` ou arquivo dedicado) antes de definir os tokens de cor.
- Definir: fundo preto/branco (dark!
), texto neutro, roxo `#561394` como accent/destaque (botões, links ativos, badges).

## 5. Reorganização do frontend
- Estrutura mais organizada: seções com dropdowns (collapse/expand por área, status, ou recorrência?).
- É onde a checklist recorrente (item 2) vai encaixar — dentro dessa nova organização, não em aba separada.
- A confirmar: quais telas entram nessa reorganização (`todos.html`, `index.html`, `semana.html`?) e o critério de agrupamento dos dropdowns.

## 6. Disciplina + Grade Horária (faculdade)
- Nova tabela `Disciplina`: nome, professor, local/sala, cor.
- Nova tabela `HorarioAula`: disciplina_id, dia da semana, hora início, hora fim — grade fixa da semana (referência visual, não gera Items).
- `Item` ganha `disciplina_id` opcional (FK), pra vincular tarefas/provas/trabalhos a uma disciplina.
- Nova tela "Faculdade": grade horária da semana (grid seg-sex por horário) + itens pendentes agrupados por disciplina (usando os dropdowns do item 5).

## 7. Lista de compras (dentro de PESSOAL)
- Checklist simples, categorias fixas: Mercado, Farmácia, Internet (compras online).
- Aproveita o `AreaItem.COMPRAS` que já existe no model — usar `Item` com `area=compras` + um subcampo/tag pra categoria (mercado/farmácia/internet), em vez de criar tabela nova agora.
- Fica dentro do dropdown PESSOAL como uma das seções.

## 8. Header desktop com navegação em dropdowns
- Header convencional com 3 menus: **TAREFAS**, **FACULDADE**, **PESSOAL**.
  - TAREFAS → Hoje, Semana, Geral (as telas que já existem hoje).
  - FACULDADE → grade horária + itens por disciplina (item 6).
  - PESSOAL → lista de compras (item 7) por enquanto; espaço pra crescer depois.
- Só desktop por enquanto (mobile fica pra depois, a definir).
- Provavelmente vira um `header.html`/componente compartilhado incluído nas páginas (hoje cada página parece independente — confirmar durante implementação).

## Ordem sugerida de execução

### Fase 1 — fluxo vertical (base do dia) ✅ concluída
1. ✅ Dedup de título (item 3) — 409 no backend + toast no frontend
2. ✅ Header com dropdowns (item 8) — TAREFAS/FACULDADE/PESSOAL, `static/header.js` compartilhado
3. ✅ Paleta de cores (item 4) — `static/theme.css` com `--accent: #561394`, aplicado em botões/checkboxes/focus
4. ✅ Lista de compras (item 7) — `/pessoal`, campo `categoria_compra` no Item (migration `0c8c76675696`)

### Fase 2 — conteúdo maior (em andamento)
5. ✅ Disciplina + Grade Horária (item 6) — `/disciplinas` API, tela `/faculdade` com grade seg-sáb e itens por disciplina
6. ✅ RecurringTemplate (item 2) — `/recorrentes` API + job diário no scheduler (6h) + seção "Recorrências" em `/todos`

### Fase 3 — infra (não trava uso diário, pode ser o último)
7. ✅ Cron externo / health check (item 1) — `.github/workflows/keep-alive.yml` batendo `/health` às 10:55 UTC (7:55 BRT)

## Bug corrigido no caminho
- O scheduler usava `datetime.now()` sem timezone. Como o Render roda em UTC por padrão, o resumo das "8h" na verdade disparava às 5h da manhã no Brasil. Corrigido em `app/services/scheduler.py` com `agora_local()` fixando `America/Sao_Paulo`.

## Extras (pedidos durante o dia, fora do plano original)
- ✅ Sala por horário de aula (não mais por disciplina) — mesma matéria pode ter salas diferentes em dias diferentes
- ✅ Edição completa de disciplina (nome/professor/horários/salas) e exclusão, tudo no mesmo modal
- ✅ Checklist (subtarefas) dentro de qualquer tarefa — modal de edição em Hoje/Semana/Geral/Calendário
- ✅ "Banco" de checklist concluída — histórico em `/todos`
- ✅ Badge de progresso "☑ 2/5" no card da tarefa quando ela tem checklist
- ✅ Grade da faculdade virou tabela de verdade (1 linha por hora, estilo grade acadêmica) em vez de blocos soltos
- ✅ Container da Faculdade mais largo, tabela e lista de disciplinas lado a lado (row) em telas grandes
- ✅ Cards da grade agora são clicáveis — abrem modal com tarefas + checklist daquela matéria

## Em aberto / próximos passos (não é hoje)
- Ideias do `ideas.txt` (captura em linguagem natural, drag-and-drop, subtarefas, command palette) ficam pra depois.
