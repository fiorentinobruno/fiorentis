const toast = document.getElementById("toast");

let toastTimeout = null;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ---------- Itens da checklist ----------
async function carregarChecklistItems() {
  const resp = await fetch("/api/dashboard/checklist-items");
  const itens = await resp.json();
  const lista = document.getElementById("lista-checklist-items");
  lista.innerHTML = "";

  itens.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "flex items-center gap-2";

    const input = document.createElement("input");
    input.type = "text";
    input.value = item.titulo;
    input.className =
      "flex-1 border border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]";
    input.addEventListener("blur", async () => {
      const novoTitulo = input.value.trim();
      if (!novoTitulo || novoTitulo === item.titulo) return;
      await fetch(`/api/dashboard/checklist-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: novoTitulo }),
      });
      mostrarToast("Item atualizado");
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
    });

    const btnSubir = document.createElement("button");
    btnSubir.type = "button";
    btnSubir.textContent = "↑";
    btnSubir.className = "icon-btn";
    btnSubir.disabled = index === 0;
    btnSubir.addEventListener("click", async () => {
      const vizinho = itens[index - 1];
      await Promise.all([
        fetch(`/api/dashboard/checklist-items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordem: vizinho.ordem }),
        }),
        fetch(`/api/dashboard/checklist-items/${vizinho.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordem: item.ordem }),
        }),
      ]);
      await carregarChecklistItems();
    });

    const btnDescer = document.createElement("button");
    btnDescer.type = "button";
    btnDescer.textContent = "↓";
    btnDescer.className = "icon-btn";
    btnDescer.disabled = index === itens.length - 1;
    btnDescer.addEventListener("click", async () => {
      const vizinho = itens[index + 1];
      await Promise.all([
        fetch(`/api/dashboard/checklist-items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordem: vizinho.ordem }),
        }),
        fetch(`/api/dashboard/checklist-items/${vizinho.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordem: item.ordem }),
        }),
      ]);
      await carregarChecklistItems();
    });

    const btnDesativar = document.createElement("button");
    btnDesativar.type = "button";
    btnDesativar.textContent = "Desativar";
    btnDesativar.className = "icon-btn icon-btn-danger text-xs px-2 w-auto";
    btnDesativar.addEventListener("click", async () => {
      await fetch(`/api/dashboard/checklist-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: false }),
      });
      mostrarToast("Item desativado");
      await carregarChecklistItems();
    });

    li.appendChild(input);
    li.appendChild(btnSubir);
    li.appendChild(btnDescer);
    li.appendChild(btnDesativar);
    lista.appendChild(li);
  });
}

document.getElementById("form-novo-item").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = e.target.querySelector("input");
  const titulo = input.value.trim();
  if (!titulo) return;
  await fetch("/api/dashboard/checklist-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo }),
  });
  input.value = "";
  mostrarToast("Item criado");
  await carregarChecklistItems();
});

// ---------- Frases ----------
async function carregarQuotes() {
  const resp = await fetch("/api/dashboard/quotes");
  const quotes = await resp.json();

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const amanhaIso = `${amanha.getFullYear()}-${String(amanha.getMonth() + 1).padStart(2, "0")}-${String(amanha.getDate()).padStart(2, "0")}`;

  const quoteAmanha = quotes.find((q) => q.data_alvo === amanhaIso);
  document.getElementById("input-frase-amanha").value = quoteAmanha ? quoteAmanha.texto : "";

  const fallbacks = quotes.filter((q) => q.is_fallback);
  const lista = document.getElementById("lista-fallback-quotes");
  lista.innerHTML = "";

  for (const quote of fallbacks) {
    const li = document.createElement("li");
    li.className = "flex items-center gap-2";

    const span = document.createElement("span");
    span.className = "flex-1 text-sm text-slate-300";
    span.textContent = quote.texto;

    const btnRemover = document.createElement("button");
    btnRemover.type = "button";
    btnRemover.textContent = "×";
    btnRemover.className = "icon-btn icon-btn-danger";
    btnRemover.addEventListener("click", async () => {
      await fetch(`/api/dashboard/quotes/${quote.id}`, { method: "DELETE" });
      mostrarToast("Frase removida");
      await carregarQuotes();
    });

    li.appendChild(span);
    li.appendChild(btnRemover);
    lista.appendChild(li);
  }
}

document.getElementById("form-frase-amanha").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("input-frase-amanha");
  const texto = input.value.trim();
  if (!texto) return;
  await fetch("/api/dashboard/quotes/amanha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto }),
  });
  mostrarToast("Frase de amanhã salva");
});

document.getElementById("form-nova-fallback").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = e.target.querySelector("input");
  const texto = input.value.trim();
  if (!texto) return;
  await fetch("/api/dashboard/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto }),
  });
  input.value = "";
  mostrarToast("Frase adicionada");
  await carregarQuotes();
});

carregarChecklistItems();
carregarQuotes();
