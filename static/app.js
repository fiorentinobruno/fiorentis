const COLUNAS = ["inbox", "a_fazer", "em_andamento", "feito"];

const vaziaEl = document.getElementById("lista-vazia");
const dataHojeEl = document.getElementById("header-info");

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
const abrirVisualizacao = setupVisualizacao(abrirEdicao, carregarHoje);
setupCaptura(carregarHoje, mostrarToast);

const filtroTempo = configurarChips("chips-filtro-tempo");
document.getElementById("chips-filtro-tempo").addEventListener("click", () => carregarHoje());

async function carregarHoje() {
  const tempo = filtroTempo.getValor();
  const url = tempo ? `/items?view=hoje&tempo_estimado=${tempo}` : "/items?view=hoje";
  const resp = await fetch(url);
  const itens = await resp.json();

  vaziaEl.classList.toggle("hidden", itens.length > 0);

  for (const status of COLUNAS) {
    const colunaEl = document.getElementById(`coluna-${status}`);
    const contagemEl = document.getElementById(`contagem-${status}`);
    const itensDaColuna = itens.filter((item) => item.status === status);

    colunaEl.innerHTML = "";
    contagemEl.textContent = itensDaColuna.length > 0 ? itensDaColuna.length : "";

    for (const item of itensDaColuna) {
      colunaEl.appendChild(renderItem(item, marcarFeito, abrirEdicao, abrirVisualizacao));
    }
  }
}

carregarHoje();

const modalFecharDia = document.getElementById("modal-fechar-dia");
const fecharDiaResumoEl = document.getElementById("fechar-dia-resumo");
const fecharDiaPendentesEl = document.getElementById("fechar-dia-pendentes");
const reagendamentos = {};

async function abrirFecharDia() {
  const resp = await fetch("/items?view=hoje");
  const itens = await resp.json();
  const pendentes = itens.filter((i) => i.status === "a_fazer" || i.status === "em_andamento");
  const feitas = itens.filter((i) => i.status === "feito").length;

  fecharDiaResumoEl.textContent = `${feitas} de ${itens.length} feitas hoje`;

  Object.keys(reagendamentos).forEach((k) => delete reagendamentos[k]);
  fecharDiaPendentesEl.innerHTML = "";
  for (const item of pendentes) {
    const linha = document.createElement("div");
    linha.className = "flex items-center gap-2 text-sm";

    const titulo = document.createElement("span");
    titulo.textContent = item.titulo;
    titulo.className = "flex-1 truncate";

    const dataInput = document.createElement("input");
    dataInput.type = "date";
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    dataInput.value = amanha.toISOString().slice(0, 10);
    dataInput.className = "border border-slate-700 rounded-lg px-2 py-1 text-xs";
    dataInput.addEventListener("change", () => {
      reagendamentos[item.id] = dataInput.value;
    });

    linha.appendChild(titulo);
    linha.appendChild(dataInput);
    fecharDiaPendentesEl.appendChild(linha);
  }

  modalFecharDia.classList.remove("hidden");
}

document.getElementById("btn-fechar-dia").addEventListener("click", abrirFecharDia);
document.getElementById("btn-fechar-dia-cancelar").addEventListener("click", () => {
  modalFecharDia.classList.add("hidden");
});
document.getElementById("btn-fechar-dia-confirmar").addEventListener("click", async () => {
  const resp = await fetch("/items/fechar-dia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reagendamentos }),
  });
  const resumo = await resp.json();
  modalFecharDia.classList.add("hidden");
  mostrarToast(`${resumo.itens_reagendados} item(ns) adiado(s) pra amanhã`);
  await carregarHoje();
});
