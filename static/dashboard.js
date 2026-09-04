const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DIAS_SEMANA_ABREV = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const toast = document.getElementById("toast");

let toastTimeout = null;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2500);
}

function formatarDataCurta(isoDate) {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}`;
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------- Frase do dia ----------
async function carregarFrase() {
  const resp = await fetch("/api/dashboard/quote");
  const quote = await resp.json();
  const secao = document.getElementById("secao-frase");
  if (!quote) {
    secao.classList.add("hidden");
    return;
  }
  document.getElementById("frase-texto").textContent = quote.texto;
  secao.classList.remove("hidden");
}

// ---------- Agenda ----------
const modalAgenda = document.getElementById("modal-agenda");
let agendaItemAtual = null;

function abrirModalAgenda(item) {
  agendaItemAtual = item;
  document.getElementById("modal-agenda-titulo").textContent = item.titulo;
  document.getElementById("modal-agenda-descricao").textContent = item.descricao || "Sem descrição.";
  modalAgenda.classList.remove("hidden");
}

function fecharModalAgenda() {
  modalAgenda.classList.add("hidden");
  agendaItemAtual = null;
}

document.getElementById("btn-modal-agenda-fechar").addEventListener("click", fecharModalAgenda);
modalAgenda.addEventListener("click", (e) => {
  if (e.target === modalAgenda) fecharModalAgenda();
});
document.getElementById("btn-modal-agenda-concluir").addEventListener("click", async () => {
  if (!agendaItemAtual) return;
  await fetch(`/api/dashboard/agenda/${agendaItemAtual.id}/concluir`, { method: "POST" });
  mostrarToast("Concluído!");
  fecharModalAgenda();
  await carregarAgenda();
});

async function concluirAgendaItem(id) {
  await fetch(`/api/dashboard/agenda/${id}/concluir`, { method: "POST" });
  mostrarToast("Concluído!");
  await carregarAgenda();
}

async function carregarAgenda() {
  const resp = await fetch("/api/dashboard/agenda");
  const itens = await resp.json();
  const lista = document.getElementById("lista-agenda");
  const vazia = document.getElementById("agenda-vazia");
  lista.innerHTML = "";
  vazia.classList.toggle("hidden", itens.length > 0);

  for (const item of itens) {
    lista.appendChild(renderItem(item, (id) => concluirAgendaItem(id), null, abrirModalAgenda));
  }
}

// ---------- Checklist semanal ----------
let semanaReferencia = hojeISO();

function renderChecklistHead(semanaInicio) {
  const thead = document.getElementById("checklist-thead");
  const [ano, mes, dia] = semanaInicio.split("-").map(Number);
  const inicio = new Date(ano, mes - 1, dia);
  let html = `<th class="text-left text-xs text-slate-500 font-medium pb-2" style="width: 26%;">Item</th>`;
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const ehHoje = iso === hojeISO();
    html += `<th class="text-center text-xs font-medium pb-2 ${ehHoje ? "text-[color:var(--accent-soft)]" : "text-slate-500"}" style="width: 10.57%;">
      <span class="sm:hidden">${DIAS_SEMANA_ABREV[i]}</span><span class="hidden sm:inline">${DIAS_SEMANA[i]}</span>
    </th>`;
  }
  thead.innerHTML = html;
}

async function toggleChecklistLog(itemId, dataIso, checkbox) {
  const resp = await fetch(`/api/dashboard/checklist/${itemId}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: dataIso }),
  });
  if (!resp.ok) {
    checkbox.checked = !checkbox.checked;
    mostrarToast("Erro ao atualizar");
    return;
  }
  await carregarGrafico();
}

async function carregarChecklistSemana() {
  const resp = await fetch(`/api/dashboard/checklist?data=${semanaReferencia}`);
  const semana = await resp.json();

  renderChecklistHead(semana.semana_inicio);
  document.getElementById("semana-label").textContent =
    `${formatarDataCurta(semana.semana_inicio)} – ${formatarDataCurta(semana.semana_fim)}`;

  const tbody = document.getElementById("checklist-tbody");
  tbody.innerHTML = "";

  for (const linha of semana.linhas) {
    const tr = document.createElement("tr");
    const tdTitulo = document.createElement("td");
    tdTitulo.className = "text-sm text-slate-200 pr-2 truncate align-middle";
    tdTitulo.title = linha.titulo + (linha.ativo ? "" : " (inativo)");
    tdTitulo.textContent = linha.titulo + (linha.ativo ? "" : " (inativo)");
    tr.appendChild(tdTitulo);

    for (const cel of linha.dias) {
      const td = document.createElement("td");
      td.className = "text-center align-middle w-10";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = cel.feito;
      checkbox.className = "w-5 h-5 rounded accent-[color:var(--accent)] cursor-pointer";
      checkbox.addEventListener("change", () => toggleChecklistLog(linha.item_id, cel.data, checkbox));
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  const proximaSemanaInicio = new Date(semana.semana_inicio + "T00:00:00");
  proximaSemanaInicio.setDate(proximaSemanaInicio.getDate() + 7);
  const hoje = new Date(hojeISO() + "T00:00:00");
  document.getElementById("btn-semana-proxima").disabled = proximaSemanaInicio > hoje;
  document.getElementById("btn-semana-proxima").classList.toggle("opacity-30", proximaSemanaInicio > hoje);
}

document.getElementById("btn-semana-anterior").addEventListener("click", () => {
  const d = new Date(semanaReferencia + "T00:00:00");
  d.setDate(d.getDate() - 7);
  semanaReferencia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  carregarChecklistSemana();
});

document.getElementById("btn-semana-proxima").addEventListener("click", () => {
  const d = new Date(semanaReferencia + "T00:00:00");
  d.setDate(d.getDate() + 7);
  const candidato = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (new Date(candidato + "T00:00:00") > new Date(hojeISO() + "T00:00:00")) return;
  semanaReferencia = candidato;
  carregarChecklistSemana();
});

// ---------- Gráfico ----------
let periodoAtual = 7;
let chartInstance = null;

function marcarBotaoPeriodo() {
  document.querySelectorAll(".btn-periodo").forEach((btn) => {
    const ativo = Number(btn.dataset.dias) === periodoAtual;
    btn.classList.toggle("bg-[color:var(--accent)]", ativo);
    btn.classList.toggle("text-white", ativo);
    btn.classList.toggle("border-[color:var(--accent)]", ativo);
  });
}

document.querySelectorAll(".btn-periodo").forEach((btn) => {
  btn.addEventListener("click", () => {
    periodoAtual = Number(btn.dataset.dias);
    marcarBotaoPeriodo();
    carregarGrafico();
  });
});

async function carregarGrafico() {
  const resp = await fetch(`/api/dashboard/checklist/grafico?dias=${periodoAtual}`);
  const pontos = await resp.json();

  const labels = pontos.map((p) => formatarDataCurta(p.data));
  const valores = pontos.map((p) => p.total_feitos);

  const ctx = document.getElementById("grafico-checklist").getContext("2d");
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#22d3ee";

  const gradiente = ctx.createLinearGradient(0, 0, 0, 220);
  gradiente.addColorStop(0, `color-mix(in srgb, ${accent} 35%, transparent)`);
  gradiente.addColorStop(1, `color-mix(in srgb, ${accent} 0%, transparent)`);

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Itens concluídos",
          data: valores,
          borderColor: accent,
          backgroundColor: gradiente,
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: accent,
          pointHoverBorderColor: "#0f172a",
          pointHoverBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e293b",
          borderColor: accent,
          borderWidth: 1,
          titleColor: "#e2e8f0",
          bodyColor: "#e2e8f0",
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748b", font: { size: 11 } },
          grid: { display: false },
          border: { color: "rgba(148,163,184,0.15)" },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#64748b", precision: 0, font: { size: 11 } },
          grid: { color: "rgba(148,163,184,0.08)" },
          border: { display: false },
        },
      },
    },
  });
}

async function carregarResumo() {
  const resp = await fetch("/api/dashboard/resumo");
  const resumo = await resp.json();

  function tile(valor, rotulo, corValor, corBorda) {
    const div = document.createElement("div");
    div.className = `rounded-lg bg-slate-950/40 border-l-2 ${corBorda} px-3 py-2`;
    div.innerHTML = `
      <p class="text-2xl font-bold leading-none tracking-tight ${corValor}">${valor}</p>
      <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500 mt-1.5">${rotulo}</p>
    `;
    return div;
  }

  function renderPeriodo(elId, periodo) {
    const el = document.getElementById(elId);
    el.innerHTML = "";
    el.appendChild(tile(periodo.tarefas_feitas, "feitas", "text-emerald-400", "border-emerald-500/60"));
    el.appendChild(tile(periodo.tarefas_pendentes, "pendentes", "text-amber-400", "border-amber-500/60"));
    el.appendChild(
      tile(periodo.eventos, periodo.eventos === 1 ? "evento" : "eventos", "text-sky-400", "border-sky-500/60")
    );
    el.appendChild(
      tile(
        `${periodo.checklist_feitos}/${periodo.checklist_total}`,
        "checklist",
        "text-[color:var(--accent-soft)]",
        "border-[color:var(--accent)]/60"
      )
    );
  }

  renderPeriodo("resumo-hoje", resumo.hoje);
  renderPeriodo("resumo-semana", resumo.semana);
}

marcarBotaoPeriodo();
carregarResumo();
carregarFrase();
carregarAgenda();
carregarChecklistSemana();
carregarGrafico();

// Se a página ficar aberta passando da meia-noite, recarrega tudo que depende
// do dia atual (agenda, frase, destaque de "hoje" na checklist e no gráfico).
let diaAtualObservado = hojeISO();
setInterval(() => {
  const diaAgora = hojeISO();
  if (diaAgora === diaAtualObservado) return;
  const estavaNaSemanaAtual = semanaReferencia === diaAtualObservado;
  diaAtualObservado = diaAgora;
  if (estavaNaSemanaAtual) semanaReferencia = diaAgora;
  carregarResumo();
  carregarFrase();
  carregarAgenda();
  carregarChecklistSemana();
  carregarGrafico();
}, 60000);
