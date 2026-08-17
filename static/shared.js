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
  alta: "bg-red-100 text-red-700",
  media: "bg-amber-100 text-amber-700",
  baixa: "bg-slate-100 text-slate-600",
};

const PRIORIDADE_COR_FUNDO = {
  urgente: "bg-purple-200",
  alta: "bg-red-200",
  media: "bg-[#fdecb0]",
  baixa: "bg-slate-200",
};

const PRIORIDADE_DOT = {
  urgente: "bg-purple-600",
  alta: "bg-red-500",
  media: "bg-amber-500",
  baixa: "bg-slate-400",
};
const PRIORIDADE_DOT_PADRAO = "bg-sky-400";

const STATUS_ROTULO = {
  inbox: "Inbox",
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  feito: "Feito",
  arquivado: "Arquivado",
};

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
function renderItem(item, onToggleFeito, onEdit) {
  const li = document.createElement("li");
  const corArea = AREA_COR[item.area] || "border-l-slate-300";
  const feito = item.status === "feito";

  let corFundo = "bg-white";
  if (feito) {
    corFundo = "bg-emerald-200";
  } else if (item.prioridade) {
    corFundo = PRIORIDADE_COR_FUNDO[item.prioridade];
  }

  li.className = `rounded-lg border border-slate-200 border-l-4 ${corArea} p-4 flex items-start gap-3 ${corFundo}`;

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
  titulo.className = `text-sm font-medium break-words ${feito ? "line-through text-slate-400" : ""}`;
  linhaTitulo.appendChild(titulo);

  corpo.appendChild(linhaTitulo);

  if (item.descricao) {
    const desc = document.createElement("p");
    desc.textContent = item.descricao;
    desc.className = "text-xs text-slate-400 mt-1 break-words";
    corpo.appendChild(desc);
  }

  const linha2 = document.createElement("div");
  linha2.className = "flex items-center gap-2 mt-2 flex-wrap";

  if (item.area) {
    const areaBadge = document.createElement("span");
    areaBadge.textContent = item.area.replace("_", " ");
    areaBadge.className = "text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500";
    linha2.appendChild(areaBadge);
  }

  if (item.prioridade) {
    const badge = document.createElement("span");
    badge.textContent = item.prioridade;
    badge.className = `text-xs px-2 py-0.5 rounded-full font-medium ${PRIORIDADE_COR[item.prioridade]}`;
    linha2.appendChild(badge);
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
      prazo.className = "text-xs text-slate-400";
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
    btnEditar.className = "text-slate-400 hover:text-slate-700 text-base leading-none px-1 shrink-0";
    btnEditar.addEventListener("click", () => onEdit(item));
    li.appendChild(btnEditar);
  }

  return li;
}

/**
 * Liga o botão flutuante de captura rápida (markup #btn-capturar / #modal-captura) ao POST /items.
 * onSalvo() é chamado depois de um POST bem-sucedido, pra recarregar a lista da página.
 */
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

  function abrir() {
    modal.classList.remove("hidden");
    form.reset();
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

    const payload = { titulo };
    if (inputDescricao.value.trim()) payload.descricao = inputDescricao.value.trim();
    if (inputTipo.value) payload.tipo = inputTipo.value;
    if (inputArea.value) payload.area = inputArea.value;
    if (inputPrioridade.value) payload.prioridade = inputPrioridade.value;
    if (inputPrazo.value) payload.prazo = inputPrazo.value;
    if (inputDataEvento.value) payload.data_evento = inputDataEvento.value;
    if (inputFocoHoje.checked) payload.foco_hoje = true;
    if (inputLembrete.value) payload.lembrete_minutos = Number(inputLembrete.value);

    const resp = await fetch("/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

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

  let itemAtualId = null;

  function paraInputDatetime(valor) {
    if (!valor) return "";
    return valor.slice(0, 16);
  }

  function fechar() {
    modal.classList.add("hidden");
    itemAtualId = null;
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
    modal.classList.remove("hidden");
  }

  btnCancelar.addEventListener("click", fechar);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fechar();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!itemAtualId) return;

    const payload = {
      titulo: campoTitulo.value.trim(),
      descricao: campoDescricao.value.trim() || null,
      tipo: campoTipo.value || null,
      area: campoArea.value || null,
      prioridade: campoPrioridade.value || null,
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
