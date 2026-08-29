const listaEl = document.getElementById("lista-projetos");
const vaziaEl = document.getElementById("lista-vazia");
const toast = document.getElementById("toast");

let toastTimeout = null;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2500);
}

const STATUS_ROTULO_PROJETO = {
  nao_iniciado: "Não iniciado",
  andando: "Andando",
  pausado: "Pausado",
  feito: "Feito",
};

// ---------- Modal criar/editar projeto ----------

const modalProjeto = document.getElementById("modal-projeto");
const formProjeto = document.getElementById("form-projeto");
const projetoTituloModal = document.getElementById("projeto-titulo-modal");
const campoProjetoTitulo = document.getElementById("projeto-titulo");
const campoProjetoStatus = document.getElementById("projeto-status");
const campoProjetoNotas = document.getElementById("projeto-notas");
const btnProjetoExcluir = document.getElementById("btn-projeto-excluir");

let projetoEditandoId = null;

function abrirNovoProjeto() {
  projetoEditandoId = null;
  projetoTituloModal.textContent = "Novo projeto";
  formProjeto.reset();
  campoProjetoStatus.value = "nao_iniciado";
  btnProjetoExcluir.classList.add("hidden");
  modalProjeto.classList.remove("hidden");
}

function abrirEditarProjeto(projeto) {
  projetoEditandoId = projeto.id;
  projetoTituloModal.textContent = "Editar projeto";
  campoProjetoTitulo.value = projeto.titulo;
  campoProjetoStatus.value = projeto.status;
  campoProjetoNotas.value = projeto.notas || "";
  btnProjetoExcluir.classList.remove("hidden");
  modalProjeto.classList.remove("hidden");
}

document.getElementById("btn-novo-projeto").addEventListener("click", abrirNovoProjeto);
document.getElementById("btn-projeto-cancelar").addEventListener("click", () => {
  modalProjeto.classList.add("hidden");
});
modalProjeto.addEventListener("click", (e) => {
  if (e.target === modalProjeto) modalProjeto.classList.add("hidden");
});

formProjeto.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    titulo: campoProjetoTitulo.value.trim(),
    status: campoProjetoStatus.value,
    notas: campoProjetoNotas.value.trim() || null,
  };
  const url = projetoEditandoId ? `/api/projetos/${projetoEditandoId}` : "/api/projetos";
  const method = projetoEditandoId ? "PATCH" : "POST";
  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  modalProjeto.classList.add("hidden");
  mostrarToast("Projeto salvo");
  await carregarProjetos();
});

btnProjetoExcluir.addEventListener("click", async () => {
  if (!projetoEditandoId) return;
  if (!confirm("Excluir este projeto? As tarefas vinculadas ficam soltas.")) return;
  await fetch(`/api/projetos/${projetoEditandoId}`, { method: "DELETE" });
  modalProjeto.classList.add("hidden");
  mostrarToast("Projeto excluído");
  await carregarProjetos();
});

// ---------- Modal tarefas do projeto ----------

const modalTarefas = document.getElementById("modal-projeto-tarefas");
const tarefasTituloEl = document.getElementById("projeto-tarefas-titulo");
const tarefasListaEl = document.getElementById("projeto-tarefas-lista");
const tarefaInputEl = document.getElementById("projeto-tarefa-input");
const chipsTarefa = configurarChips("projeto-tarefa-chips");

let projetoTarefasId = null;

async function carregarTarefasProjeto() {
  if (!projetoTarefasId) return;
  const resp = await fetch(`/items?projeto_id=${projetoTarefasId}`);
  const itens = await resp.json();
  tarefasListaEl.innerHTML = "";
  for (const item of itens) {
    tarefasListaEl.appendChild(
      renderItem(
        item,
        async (id, feito) => {
          await fetch(`/items/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: feito ? "feito" : "a_fazer" }),
          });
          await carregarTarefasProjeto();
          await carregarProjetos();
        },
        null,
        null
      )
    );
  }
}

async function abrirTarefasProjeto(projeto) {
  projetoTarefasId = projeto.id;
  tarefasTituloEl.textContent = projeto.titulo;
  tarefaInputEl.value = "";
  chipsTarefa.setValor("");
  modalTarefas.classList.remove("hidden");
  await carregarTarefasProjeto();
}

document.getElementById("btn-fechar-projeto-tarefas").addEventListener("click", () => {
  modalTarefas.classList.add("hidden");
});
modalTarefas.addEventListener("click", (e) => {
  if (e.target === modalTarefas) modalTarefas.classList.add("hidden");
});

document.getElementById("btn-projeto-tarefa-add").addEventListener("click", async () => {
  const titulo = tarefaInputEl.value.trim();
  if (!titulo) return;
  const tempo = chipsTarefa.getValor();
  if (!tempo) {
    mostrarToast("Escolha o tempo estimado da tarefa");
    return;
  }
  await fetch("/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titulo,
      tipo: "tarefa",
      tempo_estimado: tempo,
      projeto_id: projetoTarefasId,
    }),
  });
  tarefaInputEl.value = "";
  chipsTarefa.setValor("");
  await carregarTarefasProjeto();
  await carregarProjetos();
});

// ---------- Lista de projetos ----------

function renderCardProjeto(projeto) {
  const card = document.createElement("div");
  card.className = "surface-card rounded-xl border border-slate-800 p-4 bg-slate-900 cursor-pointer hover:border-slate-700";
  card.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    abrirTarefasProjeto(projeto);
  });

  const topo = document.createElement("div");
  topo.className = "flex items-start justify-between gap-2";

  const titulo = document.createElement("p");
  titulo.textContent = projeto.titulo;
  titulo.className = "text-sm font-medium text-slate-100 break-words";
  topo.appendChild(titulo);

  const btnEditar = document.createElement("button");
  btnEditar.type = "button";
  btnEditar.textContent = "✎";
  btnEditar.title = "Editar";
  btnEditar.className = "icon-btn shrink-0";
  btnEditar.addEventListener("click", () => abrirEditarProjeto(projeto));
  topo.appendChild(btnEditar);

  card.appendChild(topo);

  const badge = document.createElement("span");
  badge.textContent = STATUS_ROTULO_PROJETO[projeto.status] || projeto.status;
  badge.className = "inline-block text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 mt-2";
  card.appendChild(badge);

  if (projeto.notas) {
    const notas = document.createElement("p");
    notas.textContent = projeto.notas;
    notas.className = "text-xs text-slate-500 mt-2 break-words whitespace-pre-wrap";
    card.appendChild(notas);
  }

  const progressoWrap = document.createElement("div");
  progressoWrap.className = "mt-3";

  const progressoTexto = document.createElement("p");
  progressoTexto.textContent = `${projeto.tarefas_feitas}/${projeto.tarefas_total} tarefas`;
  progressoTexto.className = "text-xs text-slate-500 mb-1";
  progressoWrap.appendChild(progressoTexto);

  const barraFundo = document.createElement("div");
  barraFundo.className = "h-1.5 rounded-full bg-slate-800 overflow-hidden";
  const barraPreenchida = document.createElement("div");
  const pct = projeto.tarefas_total > 0 ? (projeto.tarefas_feitas / projeto.tarefas_total) * 100 : 0;
  barraPreenchida.className = "h-full bg-[color:var(--accent)]";
  barraPreenchida.style.width = `${pct}%`;
  barraFundo.appendChild(barraPreenchida);
  progressoWrap.appendChild(barraFundo);

  card.appendChild(progressoWrap);
  return card;
}

async function carregarProjetos() {
  const resp = await fetch("/api/projetos");
  const projetos = await resp.json();

  listaEl.innerHTML = "";
  vaziaEl.classList.toggle("hidden", projetos.length > 0);

  for (const projeto of projetos) {
    listaEl.appendChild(renderCardProjeto(projeto));
  }
}

carregarProjetos();
