const listaEl = document.getElementById("lista-itens");
const vaziaEl = document.getElementById("lista-vazia");
const contagemEl = document.getElementById("contagem");
const toast = document.getElementById("toast");
const filtros = document.querySelectorAll(".filtro-status");

let statusAtual = "";

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
    btn.classList.toggle("bg-slate-900", ativo);
    btn.classList.toggle("text-white", ativo);
    btn.classList.toggle("border-slate-900", ativo);
    btn.classList.toggle("text-slate-600", !ativo);
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
setupCaptura(carregarItens, mostrarToast);

async function carregarItens() {
  const url = statusAtual ? `/items?status=${statusAtual}` : "/items";
  const resp = await fetch(url);
  let itens = await resp.json();

  if (!statusAtual) {
    itens = itens.filter((item) => item.status !== "feito");
  }

  listaEl.innerHTML = "";
  vaziaEl.classList.toggle("hidden", itens.length > 0);
  contagemEl.textContent = `${itens.length} item${itens.length === 1 ? "" : "s"}`;

  for (const item of itens) {
    listaEl.appendChild(renderItem(item, marcarFeito, abrirEdicao));
  }
}

marcarFiltroAtivo();
carregarItens();
