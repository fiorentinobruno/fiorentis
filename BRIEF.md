# Brief — App de Organização Pessoal (v2)

## Contexto

Aplicação pessoal (uso individual, não multi-usuário) para organização de tarefas, agenda e notas. Motivação: Notion não está atendendo bem para gestão de prioridades no dia a dia — é bom para armazenar informação, mas fraco para lembrar e para dar visão rápida do que importa agora.

Perfil de uso: pessoa com múltiplas demandas simultâneas (faculdade de Ciência da Computação, estágio em desenvolvimento de software na área de cybersecurity/IAM, namoro, vida pessoal, estudos externos). Precisa de um sistema de **captura rápida + priorização diária**, não de um repositório de páginas.

**Fora de escopo no v1:** finanças e academia/treino — serão gerenciados em outros apps.

## Princípios de design

1. **Captura rápida antes de tudo.** Deve ser possível registrar um item (tarefa/nota/evento) em segundos, sem precisar escolher área, prioridade ou prazo no momento da captura. Esses detalhes são preenchidos depois, num momento de "processamento" (inspirado em GTD).
2. **Tela principal organizada por tempo/urgência, não por área.** A área (faculdade, trabalho, etc.) é um atributo/filtro, não a estrutura principal de navegação. A visão default deve responder "o que eu preciso fazer hoje / essa semana", não "mostre-me tudo de faculdade".
3. **Revisão diária/semanal como funcionalidade de primeira classe.** Uma tela dedicada a repassar o que foi feito, o que ficou, e o que vem a seguir.
4. **Simplicidade visual.** Base neutra; cor é usada como código funcional (prioridade/área), não como decoração. Refinamento estético fica para depois.

## Autenticação

- **Sem JWT.** Uso é individual, não multi-usuário.
- Senha única fixa via variável de ambiente, **opcional** — só habilitada se o app for exposto além da rede local (ex: acesso do celular fora de casa). Rodando só em localhost/rede local, não é necessária.

## Escopo funcional v1

### Páginas
1. **Captura rápida** — criar item com o mínimo de fricção (só título obrigatório). Caminho mais crítico do produto. Acesso via botão flutuante (+) fixo no canto inferior direito, disponível a partir da Hoje.
2. **Hoje** — é a **página inicial** do app. Mostra vence hoje + itens atrasados (prazo passado, não feitos) + itens marcados manualmente como foco do dia (`foco_hoje`).
3. **Inbox** — tela para processar itens capturados: sair do status "inbox", definir tipo, área, prioridade/prazo (ou data_evento).
4. **Agenda/Calendário** — eventos com data e hora (`data_evento`).
5. **Revisão semanal** — retrospecto: feito vs. não feito vs. próximo, + alerta de itens que ficaram parados no inbox durante a semana.
6. **Todos os itens** — lista geral com filtros por área, status, tipo (para busca).

**Explicitamente fora do v1:** módulo financeiro, módulo de academia/treino, gamificação, analytics avançado.

### Visual / cor funcional
- Base neutra (Tailwind default: cinza/branco/preto).
- **Cor por área** → aplicada em borda/fundo do item (código visual de contexto).
- **Cor por prioridade** → aplicada em badge/ícone separado (código visual de urgência).
- Paleta exata (quais cores para quais das 7 áreas / 3 prioridades) ainda não definida — decidir na hora de implementar o frontend.

## Stack técnica

- **Backend:** FastAPI + PostgreSQL + SQLAlchemy 2.x + Alembic + Pydantic + Docker + `uv` para gerenciamento de dependências. (Sem JWT — ver seção Autenticação.)
- **Frontend:** HTML + Tailwind CSS + JavaScript puro (sem framework). Prioridade é funcionalidade, não estética.
- **Arquitetura:** em camadas (seguindo o padrão já usado no projeto Todo List API).

## Modelo de dados

Uma única entidade central `Item`, ao invés de tabelas separadas para tarefa/nota/evento — os três tipos compartilham a maior parte dos campos, e essa modelagem permite que um item mude de tipo (ex: nota vira tarefa) sem migração de dados.

```
Item
- id
- tipo: "tarefa" | "nota" | "evento"
- titulo (obrigatório)
- descricao (texto livre, opcional)
- area: "faculdade" | "trabalho" | "namoro" | "pessoal" | "estudos_externos" | "compras" | "outro"
- status: "inbox" | "a_fazer" | "em_andamento" | "feito" | "arquivado"
- prioridade: "alta" | "media" | "baixa" | null
- prazo: datetime, nullable
- data_evento: datetime, nullable (usado só quando tipo="evento")
- foco_hoje: bool, default false (marcação manual para aparecer na tela Hoje, não altera o prazo original)
- criado_em: datetime
- atualizado_em: datetime
- concluido_em: datetime, nullable
```

Regras:
- Item criado via captura rápida nasce com `status="inbox"` e só `titulo` preenchido.
- "Processar" um item = sair do inbox, definir tipo, área, prioridade/prazo (ou data_evento).
- Notas não usam `prioridade`.
- "Puxar para hoje" = setar `foco_hoje=true`, sem alterar `prazo`.

## Próximos passos sugeridos

1. Estruturar o projeto (camadas, Docker Compose, conexão com banco) — reaproveitando o que já foi validado no projeto Todo List API.
2. Modelar a tabela `Item` via SQLAlchemy + primeira migration Alembic.
3. Endpoints principais: `POST /items` (captura rápida), `GET /items?status=inbox`, `PATCH /items/{id}` (processar/editar), `GET /items?view=hoje`, `GET /items?view=semana`.
4. Tela de captura rápida (frontend) — o caminho mais crítico do produto.
5. Tela "Hoje" / revisão semanal.
6. Views por área e página "Todos os itens" (filtro, não estrutura principal).
