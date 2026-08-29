const listaEl = document.getElementById("lista-itens");
const vaziaEl = document.getElementById("lista-vazia");
const contagemEl = document.getElementById("header-info");
const toast = document.getElementById("toast");
const filtros = document.querySelectorAll(".filtro-status");

let statusAtual = "";
let notasSoltasAtivo = false;
const filtroTempo = configurarChips("chips-filtro-tempo");
document.getElementById("chips-filtro-tempo").addEventListener("click", () => carregarItens());

const btnNotasSoltas = document.getElementById("filtro-notas-soltas");
btnNotasSoltas.addEventListener("click", () => {
  notasSoltasAtivo = !notasSoltasAtivo;
  btnNotasSoltas.classList.toggle("bg-[color:var(--accent)]", notasSoltasAtivo);
  btnNotasSoltas.classList.toggle("text-white", notasSoltasAtivo);
  btnNotasSoltas.classList.toggle("border-[color:var(--accent)]", notasSoltasAtivo);
  carregarItens();
});

let toastTimeout = null;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2500);
}

function marcarFiltroAtivo() {
  filtros.forEach((btn) => {
    const ativo = btn.dataset.status === statusAtual;
    btn.classList.toggle("bg-[color:var(--accent)]", ativo);
    btn.classList.toggle("text-white", ativo);
    btn.classList.toggle("border-[color:var(--accent)]", ativo);
    btn.classList.toggle("text-slate-300", !ativo);
  });
}

filtros.forEach((btn) => {
  btn.addEventListener("click", () => {
    statusAtual = btn.dataset.status;
    marcarFiltroAtivo();
    carregarItens();
  });
});

async function marcarFeito(id, feito) {
  await fetch(`/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: feito ? "feito" : "a_fazer" }),
  });
  mostrarToast(feito ? "Concluído!" : "Reaberto");
  await carregarItens();
}

const abrirEdicao = setupEdicao(carregarItens, mostrarToast);
const abrirVisualizacao = setupVisualizacao(abrirEdicao);
setupCaptura(carregarItens, mostrarToast);

function virarTarefa(item) {
  abrirEdicao(item);
  const tipoSelect = document.getElementById("edit-tipo");
  tipoSelect.value = "tarefa";
  tipoSelect.dispatchEvent(new Event("change"));
}

async function anexarProjetoOuDisciplina(itemId, campo, valor) {
  if (!valor) return;
  await fetch(`/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [campo]: valor }),
  });
  mostrarToast("Nota anexada");
  await carregarItens();
}

async function renderAcoesNota(item) {
  const linha = document.createElement("div");
  linha.className = "flex items-center gap-2 mt-2 flex-wrap";

  const btnVirarTarefa = document.createElement("button");
  btnVirarTarefa.type = "button";
  btnVirarTarefa.textContent = "Virar tarefa";
  btnVirarTarefa.className = "text-xs px-2 py-1 rounded-lg border border-slate-700 text-slate-300";
  btnVirarTarefa.addEventListener("click", () => virarTarefa(item));
  linha.appendChild(btnVirarTarefa);

  const [projetos, disciplinas] = await Promise.all([
    fetch("/api/projetos").then((r) => r.json()),
    fetch("/disciplinas").then((r) => r.json()),
  ]);

  const selectProjeto = document.createElement("select");
  selectProjeto.className = "text-xs border border-slate-700 rounded-lg px-2 py-1 bg-slate-800";
  selectProjeto.innerHTML = '<option value="">Anexar a projeto…</option>' +
    projetos.map((p) => `<option value="${p.id}">${p.titulo}</option>`).join("");
  selectProjeto.addEventListener("change", () => anexarProjetoOuDisciplina(item.id, "projeto_id", selectProjeto.value));
  linha.appendChild(selectProjeto);

  const selectDisciplina = document.createElement("select");
  selectDisciplina.className = "text-xs border border-slate-700 rounded-lg px-2 py-1 bg-slate-800";
  selectDisciplina.innerHTML = '<option value="">Anexar a disciplina…</option>' +
    disciplinas.map((d) => `<option value="${d.id}">${d.nome}</option>`).join("");
  selectDisciplina.addEventListener("change", () => anexarProjetoOuDisciplina(item.id, "disciplina_id", selectDisciplina.value));
  linha.appendChild(selectDisciplina);

  return linha;
}

async function carregarItens() {
  if (notasSoltasAtivo) {
    const resp = await fetch("/items");
    const todos = await resp.json();
    const notas = todos.filter((item) => item.tipo === "nota" && !item.disciplina_id && !item.projeto_id);

    listaEl.innerHTML = "";
    vaziaEl.classList.toggle("hidden", notas.length > 0);
    contagemEl.textContent = `${notas.length} nota${notas.length === 1 ? "" : "s"} solta${notas.length === 1 ? "" : "s"}`;

    for (const item of notas) {
      const li = renderItem(item, marcarFeito, abrirEdicao, abrirVisualizacao);
      li.appendChild(await renderAcoesNota(item));
      listaEl.appendChild(li);
    }
    return;
  }

  const tempo = filtroTempo.getValor();
  const params = new URLSearchParams();
  if (statusAtual) params.set("status", statusAtual);
  if (tempo) params.set("tempo_estimado", tempo);
  const url = params.toString() ? `/items?${params.toString()}` : "/items";
  const resp = await fetch(url);
  let itens = await resp.json();

  if (!statusAtual) {
    itens = itens.filter((item) => item.status !== "feito");
  }

  listaEl.innerHTML = "";
  vaziaEl.classList.toggle("hidden", itens.length > 0);
  contagemEl.textContent = `${itens.length} item${itens.length === 1 ? "" : "s"}`;

  for (const item of itens) {
    listaEl.appendChild(renderItem(item, marcarFeito, abrirEdicao, abrirVisualizacao));
  }
}

marcarFiltroAtivo();
carregarItens();
