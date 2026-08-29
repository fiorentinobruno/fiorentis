const gradeEl = document.getElementById("grade-calendario");
const tituloMesEl = document.getElementById("titulo-mes");
const contagemEl = document.getElementById("header-info");
const btnMesHoje = document.getElementById("btn-mes-hoje");
const btnMesAnterior = document.getElementById("btn-mes-anterior");
const btnMesProximo = document.getElementById("btn-mes-proximo");

const modalDia = document.getElementById("modal-dia");
const modalDiaTitulo = document.getElementById("modal-dia-titulo");
const modalDiaLista = document.getElementById("modal-dia-lista");
const btnFecharDia = document.getElementById("btn-fechar-dia");

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
  await carregarMes();
  if (!modalDia.classList.contains("hidden") && diaSelecionado) {
    abrirDia(diaSelecionado);
  }
}

const abrirEdicao = setupEdicao(async () => {
  await carregarMes();
  if (!modalDia.classList.contains("hidden") && diaSelecionado) abrirDia(diaSelecionado);
}, mostrarToast);
const abrirVisualizacao = setupVisualizacao(abrirEdicao);
setupCaptura(carregarMes, mostrarToast);

const hoje = new Date();
let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();
let itensPorDia = new Map();
let diaSelecionado = null;
let disciplinasPorId = new Map();

async function carregarDisciplinas() {
  const resp = await fetch("/disciplinas");
  const disciplinas = await resp.json();
  disciplinasPorId = new Map(disciplinas.map((d) => [d.id, d.nome]));
}

function chaveDia(data) {
  const d = new Date(data);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function chaveDoObjeto(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

async function carregarMes() {
  const resp = await fetch("/items");
  const itens = await resp.json();

  itensPorDia = new Map();
  let totalNoMes = 0;

  for (const item of itens) {
    if (item.status === "arquivado") continue;
    const data = item.data_evento || item.prazo;
    if (!data) continue;

    if (item.disciplina_id) item.disciplina_nome = disciplinasPorId.get(item.disciplina_id) || null;

    const d = new Date(data);
    const chave = chaveDia(data);
    if (!itensPorDia.has(chave)) itensPorDia.set(chave, []);
    itensPorDia.get(chave).push(item);

    if (d.getFullYear() === anoAtual && d.getMonth() === mesAtual) totalNoMes += 1;
  }

  contagemEl.textContent = `${totalNoMes} item${totalNoMes === 1 ? "" : "s"} neste mês`;
  renderizarGrade();
}

function renderizarGrade() {
  const nomeMes = new Date(anoAtual, mesAtual, 1).toLocaleDateString("pt-br", {
    month: "long",
    year: "numeric",
  });
  tituloMesEl.textContent = nomeMes;

  gradeEl.innerHTML = "";

  const primeiroDoMes = new Date(anoAtual, mesAtual, 1);
  // getDay(): 0=domingo..6=sábado -> deslocamento pra semana começar na segunda
  const deslocamento = (primeiroDoMes.getDay() + 6) % 7;
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const totalCelulas = Math.ceil((deslocamento + diasNoMes) / 7) * 7;

  const inicioGrade = new Date(anoAtual, mesAtual, 1 - deslocamento);

  for (let i = 0; i < totalCelulas; i++) {
    const dataCelula = new Date(inicioGrade);
    dataCelula.setDate(inicioGrade.getDate() + i);

    const foraDoMes = dataCelula.getMonth() !== mesAtual;
    const chave = chaveDoObjeto(dataCelula.getFullYear(), dataCelula.getMonth(), dataCelula.getDate());
    const itensDoDia = itensPorDia.get(chave) || [];
    const ehHoje = chave === chaveDia(hoje);

    const celula = document.createElement("button");
    celula.type = "button";
    celula.className = [
      "min-h-[92px] sm:min-h-[120px] rounded-xl border p-2 text-left flex flex-col gap-1.5 transition",
      foraDoMes ? "border-slate-800 bg-slate-800 text-slate-600" : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-sm",
    ].join(" ");

    const numero = document.createElement("span");
    numero.textContent = dataCelula.getDate();
    numero.className = [
      "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
      ehHoje ? "bg-[color:var(--accent)] text-white" : foraDoMes ? "text-slate-600" : "text-slate-200",
    ].join(" ");
    celula.appendChild(numero);

    const itensFaculdade = itensDoDia.filter((item) => item.area === "faculdade");
    const itensRestantes = itensDoDia.filter((item) => item.area !== "faculdade");

    if (itensFaculdade.length > 0) {
      const listaFaculdade = document.createElement("div");
      listaFaculdade.className = "flex flex-col gap-0.5";

      for (const item of itensFaculdade.slice(0, 3)) {
        const rotulo = document.createElement("span");
        rotulo.textContent = item.disciplina_nome ? `${item.disciplina_nome}: ${item.titulo}` : item.titulo;
        rotulo.title = rotulo.textContent;
        const concluido = item.status === "feito";
        rotulo.className = [
          "text-[11px] leading-tight font-medium text-sky-300 bg-sky-950/50 rounded px-1 py-0.5 truncate",
          concluido ? "line-through opacity-50" : "",
        ].join(" ");
        listaFaculdade.appendChild(rotulo);
      }

      if (itensFaculdade.length > 3) {
        const extra = document.createElement("span");
        extra.textContent = `+${itensFaculdade.length - 3} faculdade`;
        extra.className = "text-[10px] text-sky-500";
        listaFaculdade.appendChild(extra);
      }

      celula.appendChild(listaFaculdade);
    }

    if (itensRestantes.length > 0) {
      const dots = document.createElement("div");
      dots.className = "flex flex-wrap gap-1 mt-auto";

      const visiveis = itensRestantes.slice(0, 8);
      for (const item of visiveis) {
        const dot = document.createElement("span");
        const cor = item.prioridade ? PRIORIDADE_DOT[item.prioridade] : PRIORIDADE_DOT_PADRAO;
        const concluido = item.status === "feito";
        dot.className = `w-2 h-2 rounded-full ${cor} ${concluido ? "opacity-30" : ""}`;
        dot.title = item.titulo;
        dots.appendChild(dot);
      }

      if (itensRestantes.length > visiveis.length) {
        const extra = document.createElement("span");
        extra.textContent = `+${itensRestantes.length - visiveis.length}`;
        extra.className = "text-[10px] text-slate-500 leading-none self-center";
        dots.appendChild(extra);
      }

      celula.appendChild(dots);
    }

    celula.addEventListener("click", () => abrirDia(dataCelula));
    gradeEl.appendChild(celula);
  }
}

function abrirDia(data) {
  diaSelecionado = data;
  const chave = chaveDia(data);
  const itensDoDia = itensPorDia.get(chave) || [];

  const rotulo = data.toLocaleDateString("pt-br", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  modalDiaTitulo.textContent = rotulo;

  modalDiaLista.innerHTML = "";
  if (itensDoDia.length === 0) {
    const vazio = document.createElement("li");
    vazio.textContent = "Nada nesse dia.";
    vazio.className = "text-sm text-slate-500 text-center py-6";
    modalDiaLista.appendChild(vazio);
  } else {
    for (const item of itensDoDia) {
      modalDiaLista.appendChild(renderItem(item, marcarFeito, abrirEdicao, abrirVisualizacao));
    }
  }

  modalDia.classList.remove("hidden");
}

btnFecharDia.addEventListener("click", () => {
  modalDia.classList.add("hidden");
  diaSelecionado = null;
});
modalDia.addEventListener("click", (e) => {
  if (e.target === modalDia) {
    modalDia.classList.add("hidden");
    diaSelecionado = null;
  }
});

btnMesAnterior.addEventListener("click", () => {
  mesAtual -= 1;
  if (mesAtual < 0) {
    mesAtual = 11;
    anoAtual -= 1;
  }
  carregarMes();
});

btnMesProximo.addEventListener("click", () => {
  mesAtual += 1;
  if (mesAtual > 11) {
    mesAtual = 0;
    anoAtual += 1;
  }
  carregarMes();
});

btnMesHoje.addEventListener("click", () => {
  mesAtual = hoje.getMonth();
  anoAtual = hoje.getFullYear();
  carregarMes();
});

carregarDisciplinas().then(carregarMes);
