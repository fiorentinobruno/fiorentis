const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const CORES = [
  "bg-sky-950/60 text-sky-300 border border-sky-800/60",
  "bg-purple-950/60 text-purple-300 border border-purple-800/60",
  "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60",
  "bg-amber-950/60 text-amber-300 border border-amber-800/60",
  "bg-pink-950/60 text-pink-300 border border-pink-800/60",
  "bg-indigo-950/60 text-indigo-300 border border-indigo-800/60",
];

const gradeEl = document.getElementById("grade-semana");
const gradeVaziaEl = document.getElementById("grade-vazia");
const abasDiaEl = document.getElementById("abas-dia");

const hojeDiaSemana = (new Date().getDay() + 6) % 7; // 0=Seg ... 6=Dom
let diaAtivoMobile = hojeDiaSemana < DIAS.length ? hojeDiaSemana : 0;

function renderAbasDia() {
  if (!abasDiaEl) return;
  abasDiaEl.innerHTML = DIAS.map(
    (d, i) => `
    <button type="button" data-dia="${i}"
      class="aba-dia flex-1 text-sm font-medium rounded-full px-3 py-1.5 transition ${
        i === diaAtivoMobile
          ? "bg-[color:var(--accent)] text-white"
          : "text-slate-400 hover:text-slate-200"
      }">${d}</button>`
  ).join("");
  abasDiaEl.querySelectorAll(".aba-dia").forEach((btn) => {
    btn.addEventListener("click", () => {
      diaAtivoMobile = Number(btn.dataset.dia);
      renderAbasDia();
      gradeEl.dataset.diaAtivo = String(diaAtivoMobile);
    });
  });
}
const listaEl = document.getElementById("lista-disciplinas");
const toast = document.getElementById("toast");

const modal = document.getElementById("modal-disciplina");
const form = document.getElementById("form-disciplina");
const tituloModal = document.getElementById("disc-titulo-modal");
const horariosContainer = document.getElementById("disc-horarios");
const btnExcluir = document.getElementById("btn-disciplina-excluir");

let disciplinaEditandoId = null;

let toastTimeout = null;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2500);
}

function badgePrazo(prazoISO, feito) {
  if (!prazoISO) return null;
  const data = new Date(prazoISO);
  const hoje = new Date();
  const somenteData = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDias = Math.round((somenteData(data) - somenteData(hoje)) / 86400000);

  let cor = "bg-slate-800 text-slate-300 border border-slate-700";
  if (feito) {
    cor = "bg-slate-800/60 text-slate-500 border border-slate-800";
  } else if (diffDias < 0) {
    cor = "bg-rose-950/60 text-rose-300 border border-rose-800/60";
  } else if (diffDias === 0) {
    cor = "bg-amber-950/60 text-amber-300 border border-amber-800/60";
  }

  const badge = document.createElement("span");
  badge.className = `inline-flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${cor}`;
  badge.textContent = data.toLocaleDateString("pt-br", { day: "2-digit", month: "2-digit" });
  return badge;
}

function corPara(disciplinaId, disciplinas) {
  const idx = disciplinas.findIndex((d) => d.id === disciplinaId);
  return CORES[idx % CORES.length];
}

function linhaHorario(horario) {
  const row = document.createElement("div");
  row.className = "flex gap-2 items-center flex-wrap";
  row.innerHTML = `
    <select class="horario-dia border border-slate-700 rounded-lg px-2 py-2 text-sm">
      ${DIAS.map((d, i) => `<option value="${i}">${d}</option>`).join("")}
    </select>
    <input type="time" class="horario-inicio border border-slate-700 rounded-lg px-2 py-2 text-sm" required />
    <input type="time" class="horario-fim border border-slate-700 rounded-lg px-2 py-2 text-sm" required />
    <input type="text" placeholder="Sala" class="horario-local border border-slate-700 rounded-lg px-2 py-2 text-sm flex-1 min-w-[6rem]" />
    <button type="button" class="btn-remover-horario icon-btn">×</button>
  `;
  if (horario) {
    row.querySelector(".horario-dia").value = horario.dia_semana;
    row.querySelector(".horario-inicio").value = horario.hora_inicio.slice(0, 5);
    row.querySelector(".horario-fim").value = horario.hora_fim.slice(0, 5);
    row.querySelector(".horario-local").value = horario.local || "";
  }
  row.querySelector(".btn-remover-horario").addEventListener("click", () => row.remove());
  return row;
}

document.getElementById("btn-add-horario").addEventListener("click", () => {
  horariosContainer.appendChild(linhaHorario());
});

function abrirModalNova() {
  disciplinaEditandoId = null;
  form.reset();
  tituloModal.textContent = "Nova disciplina";
  btnExcluir.classList.add("hidden");
  horariosContainer.innerHTML = "";
  horariosContainer.appendChild(linhaHorario());
  modal.classList.remove("hidden");
}

function abrirModalEdicao(disciplina) {
  disciplinaEditandoId = disciplina.id;
  form.reset();
  tituloModal.textContent = "Editar disciplina";
  btnExcluir.classList.remove("hidden");
  document.getElementById("disc-nome").value = disciplina.nome;
  document.getElementById("disc-professor").value = disciplina.professor || "";
  horariosContainer.innerHTML = "";
  if (disciplina.horarios.length === 0) {
    horariosContainer.appendChild(linhaHorario());
  } else {
    disciplina.horarios.forEach((h) => horariosContainer.appendChild(linhaHorario(h)));
  }
  modal.classList.remove("hidden");
}

document.getElementById("btn-nova-disciplina").addEventListener("click", abrirModalNova);

document.getElementById("btn-disciplina-cancelar").addEventListener("click", () => {
  modal.classList.add("hidden");
});

btnExcluir.addEventListener("click", async () => {
  if (!disciplinaEditandoId) return;
  if (!confirm("Excluir esta disciplina?")) return;
  await fetch(`/disciplinas/${disciplinaEditandoId}`, { method: "DELETE" });
  modal.classList.add("hidden");
  mostrarToast("Disciplina excluída");
  await carregarTudo();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const horarios = [...horariosContainer.querySelectorAll(":scope > div")]
    .filter((row) => row.querySelector(".horario-inicio").value && row.querySelector(".horario-fim").value)
    .map((row) => ({
      dia_semana: Number(row.querySelector(".horario-dia").value),
      hora_inicio: row.querySelector(".horario-inicio").value,
      hora_fim: row.querySelector(".horario-fim").value,
      local: row.querySelector(".horario-local").value.trim() || null,
    }));

  const payload = {
    nome: document.getElementById("disc-nome").value.trim(),
    professor: document.getElementById("disc-professor").value.trim() || null,
    horarios,
  };

  const url = disciplinaEditandoId ? `/disciplinas/${disciplinaEditandoId}` : "/disciplinas";
  const method = disciplinaEditandoId ? "PATCH" : "POST";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  modal.classList.add("hidden");
  mostrarToast("Disciplina salva");
  await carregarTudo();
});

function renderGrade(disciplinas) {
  gradeEl.innerHTML = "";
  gradeEl.dataset.diaAtivo = String(diaAtivoMobile);
  gradeVaziaEl.classList.toggle("hidden", disciplinas.length > 0);
  renderAbasDia();

  const blocos = disciplinas.flatMap((d) => d.horarios.map((h) => ({ ...h, disciplina: d })));

  const cabecalho = document.createElement("thead");
  cabecalho.innerHTML = `
    <tr class="bg-slate-800">
      <th class="text-left text-xs font-semibold text-slate-400 px-3 py-2 w-20">Hora</th>
      ${DIAS.map((d, i) => `<th data-dia="${i}" class="text-left text-xs font-semibold text-slate-400 px-3 py-2">${d}</th>`).join("")}
    </tr>`;
  gradeEl.appendChild(cabecalho);

  const corpo = document.createElement("tbody");

  if (blocos.length === 0) {
    gradeEl.appendChild(corpo);
    return;
  }

  const horaFimSlot = (h) => (h.hora_fim.slice(3, 5) === "00" ? Number(h.hora_fim.slice(0, 2)) - 1 : Number(h.hora_fim.slice(0, 2)));
  let horaMin = Math.min(...blocos.map((h) => Number(h.hora_inicio.slice(0, 2))));
  let horaMax = Math.max(...blocos.map(horaFimSlot));

  for (let hora = horaMin; hora <= horaMax; hora++) {
    const tr = document.createElement("tr");
    tr.className = hora % 2 === 0 ? "bg-slate-900" : "bg-slate-800";

    const tdHora = document.createElement("td");
    tdHora.textContent = `${String(hora).padStart(2, "0")}:00`;
    tdHora.className = "px-3 py-2.5 text-xs font-medium text-slate-400 border-t border-slate-800 whitespace-nowrap";
    tr.appendChild(tdHora);

    for (let dia = 0; dia < DIAS.length; dia++) {
      const td = document.createElement("td");
      td.dataset.dia = String(dia);
      td.className = "px-3 py-2.5 border-t border-slate-800 align-top";

      const bloco = blocos.find(
        (b) => b.dia_semana === dia && Number(b.hora_inicio.slice(0, 2)) <= hora && hora <= horaFimSlot(b)
      );

      if (bloco) {
        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = `w-full text-left rounded-lg px-2 py-1 text-xs font-medium cursor-pointer hover:brightness-125 transition ${corPara(bloco.disciplina.id, disciplinas)}`;
        badge.innerHTML = `<div class="font-semibold">${bloco.disciplina.nome}</div>${
          bloco.local ? `<div class="text-[11px] opacity-75">${bloco.local}</div>` : ""
        }`;
        badge.addEventListener("click", () => abrirModalMateria(bloco.disciplina));
        td.appendChild(badge);
      }

      tr.appendChild(td);
    }

    corpo.appendChild(tr);
  }

  gradeEl.appendChild(corpo);
}

async function renderListaDisciplinas(disciplinas) {
  listaEl.innerHTML = "";

  for (const disciplina of disciplinas) {
    const resp = await fetch(`/items?disciplina_id=${disciplina.id}`);
    const itens = (await resp.json()).filter((i) => !["feito", "arquivado"].includes(i.status));

    const corContagem =
      itens.length === 0
        ? "bg-slate-800 text-slate-500"
        : "bg-[color:var(--accent)] text-white";

    const card = document.createElement("details");
    card.className = "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden";
    card.innerHTML = `
      <summary class="cursor-pointer select-none px-4 py-3 flex items-center justify-between gap-2">
        <div class="min-w-0 flex items-center gap-2">
          <span class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${corContagem}" title="${itens.length} tarefa${itens.length === 1 ? "" : "s"} pendente${itens.length === 1 ? "" : "s"}">${itens.length}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-semibold text-sm">${disciplina.nome}</span>
              ${disciplina.professor ? `<span class="text-xs text-slate-500">${disciplina.professor}</span>` : ""}
            </div>
          </div>
        </div>
      </summary>
      <div class="px-4 pb-4">
        <ul class="space-y-2 mb-3 lista-itens-disciplina"></ul>
        <form class="form-add-item flex gap-2 mb-3">
          <input type="text" required autocomplete="off" placeholder="Adicionar tarefa/prova"
            class="flex-1 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]" />
          <button type="submit" class="px-3 py-2 rounded-lg bg-[color:var(--accent)] text-white text-sm font-medium">+</button>
        </form>
        <button type="button" class="btn-editar-disciplina text-xs text-[color:var(--accent-soft)] font-medium">Editar disciplina</button>
      </div>
    `;

    const ul = card.querySelector(".lista-itens-disciplina");
    for (const item of itens) {
      const li = document.createElement("li");
      li.className = "flex items-center gap-2";
      li.innerHTML = `<span class="text-sm flex-1 break-words">${item.titulo}</span>`;
      const badge = badgePrazo(item.prazo || item.data_evento, item.status === "feito");
      if (badge) li.appendChild(badge);
      const btnFeito = document.createElement("button");
      btnFeito.type = "button";
      btnFeito.textContent = "✓";
      btnFeito.className = "icon-btn";
      btnFeito.addEventListener("click", async () => {
        await fetch(`/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "feito" }),
        });
        await carregarTudo();
      });
      li.appendChild(btnFeito);
      ul.appendChild(li);
    }

    card.querySelector(".form-add-item").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = e.target.querySelector("input");
      const titulo = input.value.trim();
      if (!titulo) return;

      const resp = await fetch("/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, area: "faculdade", disciplina_id: disciplina.id }),
      });

      if (resp.status === 409) {
        mostrarToast("Já existe um item ativo com esse título");
        return;
      }

      input.value = "";
      mostrarToast("Item adicionado");
      await carregarTudo();
    });

    card.querySelector(".btn-editar-disciplina").addEventListener("click", (e) => {
      e.preventDefault();
      abrirModalEdicao(disciplina);
    });

    listaEl.appendChild(card);
  }
}

// -- Modal de tarefas/checklist da matéria --------------------------------

const modalMateria = document.getElementById("modal-materia");
const materiaTitulo = document.getElementById("materia-modal-titulo");
const materiaItensEl = document.getElementById("materia-modal-itens");
const materiaInput = document.getElementById("materia-modal-input");

let materiaAtual = null;

document.getElementById("btn-fechar-materia").addEventListener("click", () => {
  modalMateria.classList.add("hidden");
});
modalMateria.addEventListener("click", (e) => {
  if (e.target === modalMateria) modalMateria.classList.add("hidden");
});

async function abrirModalMateria(disciplina) {
  materiaAtual = disciplina;
  materiaTitulo.textContent = disciplina.nome;
  materiaInput.value = "";
  modalMateria.classList.remove("hidden");
  await renderMateriaItens();
}

async function renderMateriaItens() {
  const resp = await fetch(`/items?disciplina_id=${materiaAtual.id}`);
  const itens = (await resp.json()).filter((i) => i.status !== "arquivado");

  materiaItensEl.innerHTML = "";
  for (const item of itens) {
    materiaItensEl.appendChild(renderItemComChecklist(item));
  }
}

function renderItemComChecklist(item) {
  const feito = item.status === "feito";
  const li = document.createElement("li");
  li.className = "border border-slate-800 rounded-lg";

  const linha = document.createElement("div");
  linha.className = "flex items-start gap-2 px-2 py-2";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = feito;
  checkbox.className = "w-4 h-4 accent-[color:var(--accent)] shrink-0 mt-0.5";
  checkbox.addEventListener("change", async () => {
    await fetch(`/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: checkbox.checked ? "feito" : "a_fazer" }),
    });
    await renderMateriaItens();
    await carregarTudo();
  });

  const corpo = document.createElement("div");
  corpo.className = "flex-1 min-w-0";

  const titulo = document.createElement("span");
  titulo.textContent = item.titulo;
  titulo.className = `block text-sm break-words ${feito ? "line-through text-slate-500" : ""}`;
  corpo.appendChild(titulo);

  const dataItem = item.prazo || item.data_evento;
  if (dataItem) {
    const linhaData = document.createElement("div");
    linhaData.className = "mt-1";
    const badge = badgePrazo(dataItem, feito);
    linhaData.appendChild(badge);
    corpo.appendChild(linhaData);
  }

  const btnChecklist = document.createElement("button");
  btnChecklist.type = "button";
  btnChecklist.className = "icon-btn text-xs w-auto px-2";
  btnChecklist.textContent = item.checklist_total > 0 ? `☑ ${item.checklist_concluidos}/${item.checklist_total}` : "☑";

  const btnExcluirItem = document.createElement("button");
  btnExcluirItem.type = "button";
  btnExcluirItem.textContent = "×";
  btnExcluirItem.className = "icon-btn icon-btn-danger";
  btnExcluirItem.addEventListener("click", async () => {
    await fetch(`/items/${item.id}`, { method: "DELETE" });
    await renderMateriaItens();
    await carregarTudo();
  });

  linha.appendChild(checkbox);
  linha.appendChild(corpo);
  linha.appendChild(btnChecklist);
  linha.appendChild(btnExcluirItem);
  li.appendChild(linha);

  const bloco = document.createElement("div");
  bloco.className = "hidden px-2 pb-2 pt-1 border-t border-slate-800";
  const subUl = document.createElement("ul");
  subUl.className = "space-y-1 mb-2";
  const subForm = document.createElement("div");
  subForm.className = "flex gap-2";
  subForm.innerHTML = `
    <input type="text" autocomplete="off" placeholder="Adicionar subtarefa"
      class="flex-1 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]" />
    <button type="button" class="px-2 py-1 rounded-lg bg-[color:var(--accent)] text-white text-xs font-medium">+</button>
  `;
  bloco.appendChild(subUl);
  bloco.appendChild(subForm);
  li.appendChild(bloco);

  async function carregarSubtarefas() {
    const resp = await fetch(`/items/${item.id}/checklist`);
    const subitens = await resp.json();
    subUl.innerHTML = "";
    for (const sub of subitens) {
      const subLi = document.createElement("li");
      subLi.className = "flex items-center gap-2";

      const subCheckbox = document.createElement("input");
      subCheckbox.type = "checkbox";
      subCheckbox.checked = sub.concluido;
      subCheckbox.className = "w-3.5 h-3.5 accent-[color:var(--accent)] shrink-0";
      subCheckbox.addEventListener("change", async () => {
        await fetch(`/checklist/${sub.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concluido: subCheckbox.checked }),
        });
        await carregarSubtarefas();
        await renderMateriaItens();
        await carregarTudo();
      });

      const subTexto = document.createElement("span");
      subTexto.textContent = sub.titulo;
      subTexto.className = `text-xs flex-1 break-words ${sub.concluido ? "line-through text-slate-500" : ""}`;

      const subRemover = document.createElement("button");
      subRemover.type = "button";
      subRemover.textContent = "×";
      subRemover.className = "icon-btn";
      subRemover.addEventListener("click", async () => {
        await fetch(`/checklist/${sub.id}`, { method: "DELETE" });
        await carregarSubtarefas();
        await renderMateriaItens();
        await carregarTudo();
      });

      subLi.appendChild(subCheckbox);
      subLi.appendChild(subTexto);
      subLi.appendChild(subRemover);
      subUl.appendChild(subLi);
    }
  }

  const subInput = subForm.querySelector("input");
  const subBtnAdd = subForm.querySelector("button");
  async function adicionarSubtarefa() {
    const titulo = subInput.value.trim();
    if (!titulo) return;
    await fetch(`/items/${item.id}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo }),
    });
    subInput.value = "";
    await carregarSubtarefas();
    await renderMateriaItens();
    await carregarTudo();
  }
  subBtnAdd.addEventListener("click", adicionarSubtarefa);
  subInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarSubtarefa();
    }
  });

  btnChecklist.addEventListener("click", async () => {
    const abrindo = bloco.classList.contains("hidden");
    bloco.classList.toggle("hidden");
    if (abrindo) await carregarSubtarefas();
  });

  return li;
}

async function adicionarItemMateria() {
  const titulo = materiaInput.value.trim();
  if (!titulo || !materiaAtual) return;

  const resp = await fetch("/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo, area: "faculdade", disciplina_id: materiaAtual.id }),
  });

  if (resp.status === 409) {
    mostrarToast("Já existe um item ativo com esse título");
    return;
  }

  materiaInput.value = "";
  await renderMateriaItens();
  await carregarTudo();
}

document.getElementById("btn-materia-add-item").addEventListener("click", adicionarItemMateria);
materiaInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    adicionarItemMateria();
  }
});

async function renderSemana(disciplinas) {
  const semanaListaEl = document.getElementById("semana-lista");
  const semanaVaziaEl = document.getElementById("semana-vazia");
  if (!semanaListaEl) return;

  const resp = await fetch("/items/semana-por-disciplina");
  const agrupado = await resp.json();

  semanaListaEl.innerHTML = "";
  const disciplinaIds = Object.keys(agrupado);
  semanaVaziaEl.classList.toggle("hidden", disciplinaIds.length > 0);

  for (const disciplinaId of disciplinaIds) {
    const disciplina = disciplinas.find((d) => d.id === disciplinaId);
    const bloco = document.createElement("div");
    bloco.className = "surface-card rounded-xl border border-slate-800 p-3 bg-slate-900";

    const titulo = document.createElement("p");
    titulo.textContent = disciplina ? disciplina.nome : "Sem disciplina";
    titulo.className = "text-sm font-medium text-slate-200 mb-2";
    bloco.appendChild(titulo);

    const lista = document.createElement("ul");
    lista.className = "space-y-1.5";
    for (const item of agrupado[disciplinaId]) {
      const li = document.createElement("li");
      li.className = "text-sm text-slate-400 flex items-center justify-between gap-2";
      const nome = document.createElement("span");
      nome.textContent = item.titulo;
      nome.className = `min-w-0 break-words ${item.status === "feito" ? "line-through text-slate-600" : ""}`;
      li.appendChild(nome);
      const badge = badgePrazo(item.prazo || item.data_evento, item.status === "feito");
      if (badge) li.appendChild(badge);
      lista.appendChild(li);
    }
    bloco.appendChild(lista);
    semanaListaEl.appendChild(bloco);
  }
}

async function carregarTudo() {
  const resp = await fetch("/disciplinas");
  const disciplinas = await resp.json();
  renderGrade(disciplinas);
  await renderListaDisciplinas(disciplinas);
  await renderSemana(disciplinas);
}

setupCaptura(carregarTudo, mostrarToast);

carregarTudo();
