const CATEGORIAS = [
  { id: "mercado", label: "Mercado" },
  { id: "farmacia", label: "Farmácia" },
  { id: "internet", label: "Internet" },
  { id: "outros", label: "Outros" },
];

const secoesEl = document.getElementById("secoes-compras");
const toast = document.getElementById("toast");

let toastTimeout = null;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2500);
}

function montarSecoes() {
  secoesEl.innerHTML = CATEGORIAS.map(
    (cat) => `
    <details class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden" open>
      <summary class="cursor-pointer select-none px-4 py-3 font-semibold text-sm flex items-center justify-between">
        ${cat.label}
        <span class="text-xs font-normal text-slate-500" id="contagem-${cat.id}"></span>
      </summary>
      <div class="px-4 pb-4">
        <ul id="lista-${cat.id}" class="space-y-2 mb-3"></ul>
        <form class="form-add-compra flex gap-2" data-categoria="${cat.id}">
          <input type="text" required autocomplete="off" placeholder="Adicionar item"
            class="flex-1 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]" />
          <button type="submit"
            class="px-3 py-2 rounded-lg bg-[color:var(--accent)] text-white text-sm font-medium">+</button>
        </form>
      </div>
    </details>`
  ).join("");

  document.querySelectorAll(".form-add-compra").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const titulo = input.value.trim();
      if (!titulo) return;

      const resp = await fetch("/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          area: "compras",
          categoria_compra: form.dataset.categoria === "outros" ? null : form.dataset.categoria,
        }),
      });

      if (resp.status === 409) {
        mostrarToast("Esse item já está na lista");
        return;
      }

      input.value = "";
      mostrarToast("Item adicionado");
      await carregarCompras();
    });
  });
}

function renderLinhaCompra(item) {
  const li = document.createElement("li");
  li.className = "flex items-center gap-2";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = item.status === "feito";
  checkbox.className = "w-4 h-4 accent-[color:var(--accent)] shrink-0";
  checkbox.addEventListener("change", async () => {
    await fetch(`/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: checkbox.checked ? "feito" : "a_fazer" }),
    });
    await carregarCompras();
  });

  const titulo = document.createElement("span");
  titulo.textContent = item.titulo;
  titulo.className = `text-sm flex-1 break-words ${
    checkbox.checked ? "line-through text-slate-500" : ""
  }`;

  const btnExcluir = document.createElement("button");
  btnExcluir.type = "button";
  btnExcluir.textContent = "×";
  btnExcluir.className = "icon-btn";
  btnExcluir.addEventListener("click", async () => {
    await fetch(`/items/${item.id}`, { method: "DELETE" });
    mostrarToast("Item removido");
    await carregarCompras();
  });

  li.appendChild(checkbox);
  li.appendChild(titulo);
  li.appendChild(btnExcluir);
  return li;
}

async function carregarCompras() {
  const resp = await fetch("/items?area=compras");
  const itens = (await resp.json()).filter((item) => item.status !== "arquivado");

  for (const cat of CATEGORIAS) {
    const listaEl = document.getElementById(`lista-${cat.id}`);
    const contagemEl = document.getElementById(`contagem-${cat.id}`);
    const itensCategoria = itens.filter((item) =>
      cat.id === "outros" ? !item.categoria_compra : item.categoria_compra === cat.id
    );

    listaEl.innerHTML = "";
    for (const item of itensCategoria) {
      listaEl.appendChild(renderLinhaCompra(item));
    }

    const pendentes = itensCategoria.filter((item) => item.status !== "feito").length;
    contagemEl.textContent = pendentes > 0 ? `${pendentes} pendente${pendentes === 1 ? "" : "s"}` : "";
  }
}

montarSecoes();
carregarCompras();
