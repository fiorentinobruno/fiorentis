/**
 * Header desktop com menus em dropdown (TAREFAS / FACULDADE / PESSOAL) e,
 * no mobile, um botão de hambúrguer que abre um drawer lateral com os
 * mesmos grupos. Cada página chama initHeader({ menu: "tarefas", pagina: "hoje" })
 * informando qual menu e qual item estão ativos, pra destacar visualmente.
 */
const MENUS = [
  {
    id: "tarefas",
    label: "Tarefas",
    itens: [
      { id: "hoje", label: "Hoje", href: "/" },
      { id: "semana", label: "Semana", href: "/semana" },
      { id: "calendario", label: "Calendário", href: "/calendario" },
      { id: "geral", label: "Geral", href: "/todos" },
    ],
  },
  {
    id: "faculdade",
    label: "Faculdade",
    itens: [{ id: "faculdade", label: "Grade & disciplinas", href: "/faculdade" }],
  },
  {
    id: "pessoal",
    label: "Pessoal",
    itens: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard" },
      { id: "compras", label: "Lista de compras", href: "/pessoal" },
    ],
  },
  {
    id: "estudos",
    label: "Estudos",
    itens: [{ id: "estudos", label: "Projetos", href: "/estudos" }],
  },
];

function initHeader({ menu, pagina, titulo, extra }) {
  const root = document.getElementById("header-root");
  if (!root) return;

  const menusHtml = MENUS.map((m) => {
    const ativo = m.id === menu;
    const itensHtml = m.itens
      .map((item) => {
        const itemAtivo = ativo && item.id === pagina;
        return `<a href="${item.href}" class="block px-4 py-2 text-sm rounded-md ${
          itemAtivo
            ? "text-white bg-[color:var(--accent)]"
            : "text-slate-300 hover:bg-slate-800"
        }">${item.label}</a>`;
      })
      .join("");

    return `
      <div class="relative header-menu" data-menu="${m.id}">
        <button type="button"
          class="header-menu-btn flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-md ${
            ativo ? "text-[color:var(--accent-soft)]" : "text-slate-300 hover:bg-slate-800"
          }">
          ${m.label}
          <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
        </button>
        <div class="header-menu-dropdown hidden absolute left-0 mt-1 bg-slate-900 border border-slate-800 rounded-md shadow-lg py-1 min-w-[12rem] z-30">
          ${itensHtml}
        </div>
      </div>`;
  }).join("");

  const gruposDrawerHtml = MENUS.map((m) => {
    const ativo = m.id === menu;
    const itensHtml = m.itens
      .map((item) => {
        const itemAtivo = ativo && item.id === pagina;
        return `
          <a href="${item.href}" class="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
            itemAtivo
              ? "text-white font-medium"
              : "text-slate-300 active:bg-slate-800"
          }" style="${itemAtivo ? "background: color-mix(in srgb, var(--accent) 88%, transparent);" : ""}">
            <span>${item.label}</span>
            ${itemAtivo ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ""}
          </a>`;
      })
      .join("");

    return `
      <div class="mb-5">
        <p class="px-3.5 text-[0.65rem] font-semibold uppercase tracking-widest mb-1.5 ${
          ativo ? "text-[color:var(--accent-soft)]" : "text-slate-500"
        }">${m.label}</p>
        <div class="flex flex-col gap-0.5">${itensHtml}</div>
      </div>`;
  }).join("");

  root.innerHTML = `
    <header class="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="logo-fiorentis text-lg text-white">Fiorentis</span>
          <nav class="hidden sm:flex items-center gap-1">${menusHtml}</nav>
        </div>
        <div class="flex items-center gap-3">
          ${extra || ""}
          <p class="hidden sm:block text-sm text-slate-400" id="header-info"></p>
          <span id="conta-email" class="hidden sm:block text-xs text-slate-500 max-w-[12rem] truncate"></span>
          <button type="button" id="btn-sair" class="hidden sm:block text-sm text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800">Sair</button>
          <button type="button" id="btn-abrir-menu-mobile"
            class="sm:hidden -mr-1.5 w-10 h-10 flex items-center justify-center rounded-lg text-slate-300 active:bg-slate-800 transition-colors"
            aria-label="Abrir menu" aria-expanded="false">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Drawer mobile -->
    <div id="menu-mobile-overlay" class="sm:hidden fixed inset-0 z-40 pointer-events-none opacity-0 transition-opacity duration-300" style="background: rgba(2, 6, 23, 0.7);"></div>
    <aside id="menu-mobile-drawer"
      class="sm:hidden fixed top-0 right-0 bottom-0 z-50 w-[78%] max-w-xs translate-x-full transition-transform duration-300 ease-out bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
      role="dialog" aria-modal="true" aria-label="Menu de navegação">
      <div class="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <span class="logo-fiorentis text-base text-white">Fiorentis</span>
        <button type="button" id="btn-fechar-menu-mobile"
          class="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 active:bg-slate-800 transition-colors" aria-label="Fechar menu">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path d="M6 6l12 12"/><path d="M18 6L6 18"/>
          </svg>
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto px-2.5 py-4">${gruposDrawerHtml}</nav>
      <div class="px-2.5 py-3 border-t border-slate-800">
        <p id="conta-email-mobile" class="px-3.5 pb-1 text-xs text-slate-500 truncate"></p>
        <button type="button" id="btn-sair-mobile" class="w-full text-left px-3.5 py-2.5 rounded-xl text-sm text-slate-300 active:bg-slate-800">Sair</button>
      </div>
    </aside>`;

  // --- Dropdowns desktop ---
  const abertos = root.querySelectorAll(".header-menu");
  abertos.forEach((menuEl) => {
    const btn = menuEl.querySelector(".header-menu-btn");
    const dropdown = menuEl.querySelector(".header-menu-dropdown");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const jaAberto = !dropdown.classList.contains("hidden");
      abertos.forEach((m) => m.querySelector(".header-menu-dropdown").classList.add("hidden"));
      if (!jaAberto) dropdown.classList.remove("hidden");
    });
  });
  document.addEventListener("click", () => {
    abertos.forEach((m) => m.querySelector(".header-menu-dropdown").classList.add("hidden"));
  });

  // --- Drawer mobile (hambúrguer) ---
  const btnAbrir = document.getElementById("btn-abrir-menu-mobile");
  const btnFechar = document.getElementById("btn-fechar-menu-mobile");
  const overlay = document.getElementById("menu-mobile-overlay");
  const drawer = document.getElementById("menu-mobile-drawer");

  function abrirMenuMobile() {
    document.body.style.overflow = "hidden";
    overlay.classList.remove("pointer-events-none", "opacity-0");
    drawer.classList.remove("translate-x-full");
    btnAbrir.setAttribute("aria-expanded", "true");
  }

  function fecharMenuMobile() {
    document.body.style.overflow = "";
    overlay.classList.add("opacity-0");
    overlay.addEventListener("transitionend", () => overlay.classList.add("pointer-events-none"), { once: true });
    drawer.classList.add("translate-x-full");
    btnAbrir.setAttribute("aria-expanded", "false");
  }

  // mostra em qual conta está logado (ajuda a perceber quando o aparelho está em outra conta)
  fetch("/auth/me")
    .then((r) => (r.ok ? r.json() : null))
    .then((u) => {
      if (!u) return;
      document.getElementById("conta-email").textContent = u.email;
      document.getElementById("conta-email-mobile").textContent = u.email;
    })
    .catch(() => {});

  ["btn-sair", "btn-sair-mobile"].forEach((id) => {
    document.getElementById(id).addEventListener("click", () => Auth.sair());
  });

  btnAbrir.addEventListener("click", abrirMenuMobile);
  btnFechar.addEventListener("click", fecharMenuMobile);
  overlay.addEventListener("click", fecharMenuMobile);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharMenuMobile();
  });

  if (titulo) {
    const h1 = document.createElement("h1");
    h1.className = "sr-only";
    h1.textContent = titulo;
    root.appendChild(h1);
  }
}
