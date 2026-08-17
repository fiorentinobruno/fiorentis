const COLUNAS = ["inbox", "a_fazer", "em_andamento", "feito"];

const vaziaEl = document.getElementById("lista-vazia");
const dataHojeEl = document.getElementById("data-hoje");

const toast = document.getElementById("toast");

let toastTimeout = null;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2500);
}

dataHojeEl.textContent = new Date().toLocaleDateString("pt-br", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

async function marcarFeito(id, feito) {
  await fetch(`/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: feito ? "feito" : "a_fazer" }),
  });
  mostrarToast(feito ? "Concluído!" : "Reaberto");
  await carregarHoje();
}

const abrirEdicao = setupEdicao(carregarHoje, mostrarToast);
setupCaptura(carregarHoje, mostrarToast);

async function carregarHoje() {
  const resp = await fetch("/items?view=hoje");
  const itens = await resp.json();

  vaziaEl.classList.toggle("hidden", itens.length > 0);

  for (const status of COLUNAS) {
    const colunaEl = document.getElementById(`coluna-${status}`);
    const contagemEl = document.getElementById(`contagem-${status}`);
    const itensDaColuna = itens.filter((item) => item.status === status);

    colunaEl.innerHTML = "";
    contagemEl.textContent = itensDaColuna.length > 0 ? itensDaColuna.length : "";

    for (const item of itensDaColuna) {
      colunaEl.appendChild(renderItem(item, marcarFeito, abrirEdicao));
    }
  }
}

carregarHoje();
