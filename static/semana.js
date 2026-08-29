const COLUNAS = ["inbox", "a_fazer", "em_andamento", "feito"];

const vaziaEl = document.getElementById("lista-vazia");
const contagemEl = document.getElementById("header-info");
const toast = document.getElementById("toast");

let toastTimeout = null;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2500);
}

async function marcarFeito(id, feito) {
  await fetch(`/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: feito ? "feito" : "a_fazer" }),
  });
  mostrarToast(feito ? "Concluído!" : "Reaberto");
  await carregarSemana();
}

const abrirEdicao = setupEdicao(carregarSemana, mostrarToast);
const abrirVisualizacao = setupVisualizacao(abrirEdicao);
setupCaptura(carregarSemana, mostrarToast);

async function carregarSemana() {
  const resp = await fetch("/items?view=semana");
  const itens = await resp.json();

  vaziaEl.classList.toggle("hidden", itens.length > 0);
  contagemEl.textContent = `${itens.length} item${itens.length === 1 ? "" : "s"}`;

  for (const status of COLUNAS) {
    const colunaEl = document.getElementById(`coluna-${status}`);
    const contagemColunaEl = document.getElementById(`contagem-${status}`);
    const itensDaColuna = itens.filter((item) => item.status === status);

    colunaEl.innerHTML = "";
    contagemColunaEl.textContent = itensDaColuna.length > 0 ? itensDaColuna.length : "";

    for (const item of itensDaColuna) {
      colunaEl.appendChild(renderItem(item, marcarFeito, abrirEdicao, abrirVisualizacao));
    }
  }
}

carregarSemana();
