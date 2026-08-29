const AREA_COR = {
  faculdade: "border-l-sky-400",
  trabalho: "border-l-purple-500",
  namoro: "border-l-pink-500",
  pessoal: "border-l-emerald-500",
  estudos_externos: "border-l-indigo-500",
  compras: "border-l-amber-500",
  outro: "border-l-slate-400",
};

const PRIORIDADE_COR = {
  urgente: "bg-purple-600 text-white",
  alta: "bg-red-900/70 text-red-300",
  media: "bg-amber-900/60 text-amber-300",
  baixa: "bg-slate-800 text-slate-300",
};

const PRIORIDADE_COR_FUNDO = {
  urgente: "bg-purple-950/50",
  alta: "bg-red-950/40",
  media: "bg-amber-950/40",
  baixa: "bg-slate-800",
};

const PRIORIDADE_DOT = {
  urgente: "bg-purple-600",
  alta: "bg-red-500",
  media: "bg-amber-500",
  baixa: "bg-slate-500",
};
const PRIORIDADE_DOT_PADRAO = "bg-sky-400";

const STATUS_ROTULO = {
  inbox: "Inbox",
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  feito: "Feito",
  arquivado: "Arquivado",
};

const TEMPO_ESTIMADO_ROTULO = {
  "15min": "15min",
  "30min": "30min",
  "1h": "1h",
  "2h+": "2h+",
};

const TEMPO_ESTIMADO_ORDEM = ["15min", "30min", "1h", "2h+"];

function formatarData(data) {
  const d = new Date(data);
  return d.toLocaleDateString("pt-br", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("pt-br", { hour: "2-digit", minute: "2-digit" });
}

function formatarPrazo(item) {
  const data = item.data_evento || item.prazo;
  if (!data) return null;
  const rotulo = item.data_evento ? "" : "prazo: ";
  return rotulo + formatarData(data);
}

/**
 * Renderiza um <li> de item.
 * onToggleFeito(id, feito) é chamado ao marcar/desmarcar o checkbox.
 * onEdit(item) é chamado ao clicar no botão de editar.
 */
function renderItem(item, onToggleFeito, onEdit, onView) {
  const li = document.createElement("li");
  const corArea = AREA_COR[item.area] || "border-l-slate-300";
  const feito = item.status === "feito";

  let corFundo = "bg-slate-900";
  if (feito) {
    corFundo = "bg-emerald-950/30";
  } else if (item.prioridade) {
    corFundo = PRIORIDADE_COR_FUNDO[item.prioridade];
  }

  li.className = `surface-card rounded-xl border border-slate-800 border-l-4 ${corArea} p-4 flex items-start gap-3 ${corFundo} hover:border-slate-700 ${
    onView ? "cursor-pointer" : ""
  }`;

  if (onView) {
    li.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest('input[type="checkbox"]')) return;
      onView(item);
    });
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = feito;
  checkbox.className = "mt-1 w-5 h-5 accent-emerald-600 shrink-0";
  checkbox.addEventListener("change", () => onToggleFeito(item.id, checkbox.checked));

  const corpo = document.createElement("div");
  corpo.className = "flex-1 min-w-0";

  const linhaTitulo = document.createElement("div");
  linhaTitulo.className = "flex items-center gap-1.5";

  if (feito) {
    const check = document.createElement("span");
    check.textContent = "✓";
    check.className = "text-emerald-600 font-bold text-sm shrink-0";
    linhaTitulo.appendChild(check);
  }

  const titulo = document.createElement("p");
  titulo.textContent = item.titulo;
  titulo.className = `text-sm font-medium break-words ${feito ? "line-through text-slate-500" : "text-slate-100"}`;
  linhaTitulo.appendChild(titulo);

  corpo.appendChild(linhaTitulo);

  if (item.descricao) {
    const desc = document.createElement("p");
    desc.textContent = item.descricao;
    desc.className = "text-xs text-slate-500 mt-1 break-words";
    corpo.appendChild(desc);
  }

  const linha2 = document.createElement("div");
  linha2.className = "flex items-center gap-2 mt-2 flex-wrap";

  if (item.area) {
    const areaBadge = document.createElement("span");
    areaBadge.textContent = item.area.replace("_", " ");
    areaBadge.className = "text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400";
    linha2.appendChild(areaBadge);
  }

  if (item.disciplina_nome) {
    const materiaBadge = document.createElement("span");
    materiaBadge.textContent = item.disciplina_nome;
    materiaBadge.className = "text-xs px-2 py-0.5 rounded-full bg-sky-950/50 text-sky-300";
    linha2.appendChild(materiaBadge);
  }

  if (item.prioridade) {
    const badge = document.createElement("span");
    badge.textContent = item.prioridade;
    badge.className = `text-xs px-2 py-0.5 rounded-full font-medium ${PRIORIDADE_COR[item.prioridade]}`;
    linha2.appendChild(badge);
  }

  if (item.tempo_estimado) {
    const tempoBadge = document.createElement("span");
    tempoBadge.textContent = `⏱ ${TEMPO_ESTIMADO_ROTULO[item.tempo_estimado] || item.tempo_estimado}`;
    tempoBadge.className = "text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400";
    linha2.appendChild(tempoBadge);
  }

  if (item.checklist_total > 0) {
    const checklistBadge = document.createElement("span");
    checklistBadge.textContent = `☑ ${item.checklist_concluidos}/${item.checklist_total}`;
    checklistBadge.className = "text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400";
    linha2.appendChild(checklistBadge);
  }

  if (item.lembrete_minutos && !feito) {
    const lembrete = document.createElement("span");
    lembrete.textContent = "🔔";
    lembrete.title = `Lembrete ${item.lembrete_minutos} min antes`;
    lembrete.className = "text-xs";
    linha2.appendChild(lembrete);
  }

  if (feito && item.concluido_em) {
    const concluido = document.createElement("span");
    concluido.textContent = "concluído em " + formatarData(item.concluido_em);
    concluido.className = "text-xs text-emerald-600";
    linha2.appendChild(concluido);
  } else {
    const prazoTexto = formatarPrazo(item);
    if (prazoTexto) {
      const prazo = document.createElement("span");
      prazo.textContent = prazoTexto;
      prazo.className = "text-xs text-slate-500";
      linha2.appendChild(prazo);
    }
  }

  if (linha2.children.length > 0) corpo.appendChild(linha2);

  li.appendChild(checkbox);
  li.appendChild(corpo);

  if (onEdit) {
    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.textContent = "✎";
    btnEditar.title = "Editar";
    btnEditar.className = "icon-btn";
    btnEditar.addEventListener("click", () => onEdit(item));
    li.appendChild(btnEditar);
  }

  return li;
}

/**
 * Liga o botão flutuante de captura rápida (markup #btn-capturar / #modal-captura) ao POST /items.
 * onSalvo() é chamado depois de um POST bem-sucedido, pra recarregar a lista da página.
 */
/**
 * Mostra só o campo de data relevante pro tipo escolhido (tarefa->prazo,
 * evento->data do evento, nota->nenhum). Sem tipo escolhido, mostra os dois.
 */
function alternarCamposData(tipoSelect, campoPrazoId, campoDataEventoId) {
  function atualizar() {
    const campoPrazo = document.getElementById(campoPrazoId);
    const campoDataEvento = document.getElementById(campoDataEventoId);
    if (!campoPrazo || !campoDataEvento) return;
    const tipo = tipoSelect.value;
    campoPrazo.classList.toggle("hidden", tipo === "evento" || tipo === "nota");
    campoDataEvento.classList.toggle("hidden", tipo === "tarefa" || tipo === "nota");
  }
  tipoSelect.addEventListener("change", atualizar);
  atualizar();
  return atualizar;
}

/**
 * Mostra o seletor de chips de tempo_estimado só quando tipo === "tarefa".
 */
function alternarCampoTempoEstimado(tipoSelect, campoId) {
  function atualizar() {
    const campo = document.getElementById(campoId);
    if (!campo) return;
    campo.classList.toggle("hidden", tipoSelect.value !== "tarefa");
  }
  tipoSelect.addEventListener("change", atualizar);
  atualizar();
  return atualizar;
}

/**
 * Mostra o seletor de matéria só quando area === "faculdade", e popula suas
 * opções a partir de GET /disciplinas.
 */
function alternarCampoDisciplina(areaSelect, campoId, selectId) {
  const selectEl = document.getElementById(selectId);
  if (selectEl) {
    fetch("/disciplinas")
      .then((r) => r.json())
      .then((disciplinas) => {
        selectEl.innerHTML =
          '<option value="">—</option>' +
          disciplinas.map((d) => `<option value="${d.id}">${d.nome}</option>`).join("");
      });
  }

  function atualizar() {
    const campo = document.getElementById(campoId);
    if (!campo) return;
    campo.classList.toggle("hidden", areaSelect.value !== "faculdade");
  }
  areaSelect.addEventListener("change", atualizar);
  atualizar();
  return atualizar;
}

/**
 * Liga um grupo de botões data-valor dentro de #containerId como seletor
 * exclusivo (chip). Retorna { getValor, setValor }.
 */
function configurarChips(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    return { getValor: () => "", setValor: () => {} };
  }
  const botoes = Array.from(container.querySelectorAll("button[data-valor]"));

  function marcar(valor) {
    container.dataset.valor = valor || "";
    botoes.forEach((b) => b.classList.toggle("chip-selecionado", b.dataset.valor === valor));
  }

  botoes.forEach((btn) => {
    btn.addEventListener("click", () => {
      const jaSelecionado = container.dataset.valor === btn.dataset.valor;
      marcar(jaSelecionado ? "" : btn.dataset.valor);
    });
  });

  marcar("");
  return {
    getValor: () => container.dataset.valor || "",
    setValor: marcar,
  };
}

function setupCaptura(onSalvo, mostrarToast) {
  const modal = document.getElementById("modal-captura");
  const btnCapturar = document.getElementById("btn-capturar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const form = document.getElementById("form-captura");
  const inputTitulo = document.getElementById("input-titulo");
  const inputDescricao = document.getElementById("input-descricao");
  const inputTipo = document.getElementById("input-tipo");
  const inputArea = document.getElementById("input-area");
  const inputPrioridade = document.getElementById("input-prioridade");
  const inputPrazo = document.getElementById("input-prazo");
  const inputDataEvento = document.getElementById("input-data-evento");
  const inputFocoHoje = document.getElementById("input-foco-hoje");
  const inputLembrete = document.getElementById("input-lembrete");
  const chipsTempoEstimado = configurarChips("chips-input-tempo-estimado");
  const inputDisciplina = document.getElementById("input-disciplina");

  alternarCamposData(inputTipo, "campo-input-prazo", "campo-input-data-evento");
  const atualizarCampoTempoEstimado = alternarCampoTempoEstimado(inputTipo, "campo-input-tempo-estimado");
  const atualizarCampoDisciplina = alternarCampoDisciplina(inputArea, "campo-input-disciplina", "input-disciplina");

  function abrir() {
    modal.classList.remove("hidden");
    form.reset();
    chipsTempoEstimado.setValor("");
    atualizarCampoTempoEstimado();
    atualizarCampoDisciplina();
    inputTitulo.focus();
  }

  function fechar() {
    modal.classList.add("hidden");
  }

  btnCapturar.addEventListener("click", abrir);
  btnCancelar.addEventListener("click", fechar);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fechar();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const titulo = inputTitulo.value.trim();
    if (!titulo) return;

    if (inputTipo.value === "tarefa" && !chipsTempoEstimado.getValor()) {
      if (mostrarToast) mostrarToast("Escolha o tempo estimado da tarefa");
      return;
    }

    const payload = { titulo };
    if (inputDescricao.value.trim()) payload.descricao = inputDescricao.value.trim();
    if (inputTipo.value) payload.tipo = inputTipo.value;
    if (inputArea.value) payload.area = inputArea.value;
    if (inputPrioridade.value) payload.prioridade = inputPrioridade.value;
    if (inputTipo.value === "tarefa") payload.tempo_estimado = chipsTempoEstimado.getValor();
    if (inputArea.value === "faculdade" && inputDisciplina.value) payload.disciplina_id = inputDisciplina.value;
    if (inputPrazo.value) payload.prazo = inputPrazo.value;
    if (inputDataEvento.value) payload.data_evento = inputDataEvento.value;
    if (inputFocoHoje.checked) payload.foco_hoje = true;
    if (inputLembrete.value) payload.lembrete_minutos = Number(inputLembrete.value);

    const resp = await fetch("/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (resp.status === 409) {
      if (mostrarToast) mostrarToast("Já existe um item ativo com esse título");
      return;
    }

    fechar();
    if (mostrarToast) mostrarToast(resp.ok ? "Item salvo" : "Erro ao salvar item");
    await onSalvo();
  });
}

/**
 * Liga o modal de edição compartilhado (markup #modal-editar) ao comportamento de editar/excluir.
 * onSalvo() é chamado depois de um PATCH ou DELETE bem-sucedido, pra recarregar a lista da página.
 * Retorna a função abrirEdicao(item) a ser usada como onEdit no renderItem.
 */
/**
 * Liga o modal de visualização rápida (markup #modal-visualizar) — abre ao
 * clicar num card, mostra título/descrição, e o lápis leva pra edição.
 * Retorna a função abrirVisualizacao(item) a ser usada como onView no renderItem.
 */
function setupVisualizacao(onEdit) {
  const modal = document.getElementById("modal-visualizar");
  if (!modal) return null;

  const tituloEl = document.getElementById("visualizar-titulo");
  const descricaoEl = document.getElementById("visualizar-descricao");
  const btnEditar = document.getElementById("btn-visualizar-editar");
  const btnFechar = document.getElementById("btn-visualizar-fechar");

  let itemAtual = null;

  function fechar() {
    modal.classList.add("hidden");
    itemAtual = null;
  }

  function abrirVisualizacao(item) {
    itemAtual = item;
    tituloEl.textContent = item.titulo;
    if (item.descricao) {
      descricaoEl.textContent = item.descricao;
      descricaoEl.classList.remove("text-slate-500", "italic");
    } else {
      descricaoEl.textContent = "Sem descrição.";
      descricaoEl.classList.add("text-slate-500", "italic");
    }
    modal.classList.remove("hidden");
  }

  btnFechar.addEventListener("click", fechar);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fechar();
  });
  btnEditar.addEventListener("click", () => {
    const item = itemAtual;
    fechar();
    if (item) onEdit(item);
  });

  return abrirVisualizacao;
}

function setupEdicao(onSalvo, mostrarToast) {
  const modal = document.getElementById("modal-editar");
  const form = document.getElementById("form-editar");
  const campoTitulo = document.getElementById("edit-titulo");
  const campoDescricao = document.getElementById("edit-descricao");
  const campoTipo = document.getElementById("edit-tipo");
  const campoArea = document.getElementById("edit-area");
  const campoPrioridade = document.getElementById("edit-prioridade");
  const campoStatus = document.getElementById("edit-status");
  const campoPrazo = document.getElementById("edit-prazo");
  const campoDataEvento = document.getElementById("edit-data-evento");
  const campoFocoHoje = document.getElementById("edit-foco-hoje");
  const campoLembrete = document.getElementById("edit-lembrete");
  const btnCancelar = document.getElementById("btn-editar-cancelar");
  const btnExcluir = document.getElementById("btn-editar-excluir");
  const checklistLista = document.getElementById("edit-checklist-lista");
  const formChecklist = document.getElementById("form-edit-checklist");
  const inputChecklist = document.getElementById("edit-checklist-input");
  const chipsTempoEstimado = configurarChips("chips-edit-tempo-estimado");
  const campoDisciplina = document.getElementById("edit-disciplina");

  const atualizarCamposData = alternarCamposData(campoTipo, "campo-edit-prazo", "campo-edit-data-evento");
  const atualizarCampoTempoEstimado = alternarCampoTempoEstimado(campoTipo, "campo-edit-tempo-estimado");
  const atualizarCampoDisciplina = alternarCampoDisciplina(campoArea, "campo-edit-disciplina", "edit-disciplina");

  let itemAtualId = null;

  function paraInputDatetime(valor) {
    if (!valor) return "";
    return valor.slice(0, 16);
  }

  function fechar() {
    modal.classList.add("hidden");
    itemAtualId = null;
  }

  async function carregarChecklist() {
    if (!checklistLista || !itemAtualId) return;
    const resp = await fetch(`/items/${itemAtualId}/checklist`);
    const subitens = await resp.json();

    checklistLista.innerHTML = "";
    for (const sub of subitens) {
      const li = document.createElement("li");
      li.className = "flex items-center gap-2";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = sub.concluido;
      checkbox.className = "w-4 h-4 accent-[color:var(--accent)] shrink-0";
      checkbox.addEventListener("change", async () => {
        await fetch(`/checklist/${sub.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concluido: checkbox.checked }),
        });
        await carregarChecklist();
        await onSalvo();
      });

      const texto = document.createElement("span");
      texto.textContent = sub.titulo;
      texto.className = `text-sm flex-1 break-words ${sub.concluido ? "line-through text-slate-500" : ""}`;

      const btnRemover = document.createElement("button");
      btnRemover.type = "button";
      btnRemover.textContent = "×";
      btnRemover.className = "icon-btn";
      btnRemover.addEventListener("click", async () => {
        await fetch(`/checklist/${sub.id}`, { method: "DELETE" });
        await carregarChecklist();
        await onSalvo();
      });

      li.appendChild(checkbox);
      li.appendChild(texto);
      li.appendChild(btnRemover);
      checklistLista.appendChild(li);
    }
  }

  async function adicionarChecklistItem() {
    if (!itemAtualId) return;
    const titulo = inputChecklist.value.trim();
    if (!titulo) return;

    await fetch(`/items/${itemAtualId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo }),
    });

    inputChecklist.value = "";
    await carregarChecklist();
    await onSalvo();
  }

  if (formChecklist) {
    document.getElementById("btn-edit-checklist-add").addEventListener("click", adicionarChecklistItem);
    inputChecklist.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        adicionarChecklistItem();
      }
    });
  }

  function abrirEdicao(item) {
    itemAtualId = item.id;
    campoTitulo.value = item.titulo || "";
    campoDescricao.value = item.descricao || "";
    campoTipo.value = item.tipo || "";
    campoArea.value = item.area || "";
    campoPrioridade.value = item.prioridade || "";
    campoStatus.value = item.status || "inbox";
    campoPrazo.value = paraInputDatetime(item.prazo);
    campoDataEvento.value = paraInputDatetime(item.data_evento);
    campoFocoHoje.checked = !!item.foco_hoje;
    campoLembrete.value = item.lembrete_minutos ? String(item.lembrete_minutos) : "";
    chipsTempoEstimado.setValor(item.tempo_estimado || "");
    campoDisciplina.value = item.disciplina_id || "";
    atualizarCamposData();
    atualizarCampoTempoEstimado();
    atualizarCampoDisciplina();
    modal.classList.remove("hidden");
    carregarChecklist();
  }

  btnCancelar.addEventListener("click", fechar);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fechar();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!itemAtualId) return;

    if (campoTipo.value === "tarefa" && !chipsTempoEstimado.getValor()) {
      if (mostrarToast) mostrarToast("Escolha o tempo estimado da tarefa");
      return;
    }

    const payload = {
      titulo: campoTitulo.value.trim(),
      descricao: campoDescricao.value.trim() || null,
      tipo: campoTipo.value || null,
      area: campoArea.value || null,
      prioridade: campoPrioridade.value || null,
      tempo_estimado: campoTipo.value === "tarefa" ? chipsTempoEstimado.getValor() : null,
      disciplina_id: campoArea.value === "faculdade" ? campoDisciplina.value || null : null,
      status: campoStatus.value,
      prazo: campoPrazo.value || null,
      data_evento: campoDataEvento.value || null,
      foco_hoje: campoFocoHoje.checked,
      lembrete_minutos: campoLembrete.value ? Number(campoLembrete.value) : null,
    };

    const resp = await fetch(`/items/${itemAtualId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (resp.status === 409) {
      if (mostrarToast) mostrarToast("Já existe um item ativo com esse título");
      return;
    }

    fechar();
    if (mostrarToast) mostrarToast(resp.ok ? "Item atualizado" : "Erro ao atualizar");
    await onSalvo();
  });

  btnExcluir.addEventListener("click", async () => {
    if (!itemAtualId) return;
    if (!confirm("Excluir este item?")) return;

    await fetch(`/items/${itemAtualId}`, { method: "DELETE" });
    fechar();
    if (mostrarToast) mostrarToast("Item excluído");
    await onSalvo();
  });

  return abrirEdicao;
}
