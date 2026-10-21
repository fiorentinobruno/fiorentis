/**
 * Autenticação do front: guarda o token no localStorage e injeta o header
 * `Authorization: Bearer` em todo fetch same-origin (por isso qualquer chamada
 * existente passa a funcionar sem alteração). Respostas 401 limpam o token e
 * mandam pro /login. Deve ser o primeiro script de cada página protegida.
 */
(function () {
  const CHAVE = "fiorentis_token";
  const PAGINAS_PUBLICAS = ["/login", "/cadastro"];
  const fetchOriginal = window.fetch.bind(window);

  function lerToken() {
    try {
      return localStorage.getItem(CHAVE);
    } catch {
      return null;
    }
  }

  function salvarToken(token) {
    try {
      localStorage.setItem(CHAVE, token);
    } catch {}
  }

  function limparToken() {
    try {
      localStorage.removeItem(CHAVE);
    } catch {}
  }

  function irParaLogin() {
    if (!PAGINAS_PUBLICAS.includes(location.pathname)) location.replace("/login");
  }

  function mesmaOrigem(url) {
    try {
      return new URL(url, location.href).origin === location.origin;
    } catch {
      return false;
    }
  }

  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input.url;
    if (!mesmaOrigem(url)) return fetchOriginal(input, init);

    const caminho = new URL(url, location.href).pathname;
    const rotaDeAuth = caminho === "/auth/login" || caminho === "/auth/register";
    const token = lerToken();
    if (!token && !rotaDeAuth && !caminho.startsWith("/static/") && caminho !== "/push/public-key") {
      irParaLogin();
      return new Promise(() => {}); // a página está sendo redirecionada
    }

    const headers = new Headers((init && init.headers) || (typeof input !== "string" ? input.headers : undefined));
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

    const resp = await fetchOriginal(input, { ...init, headers });
    if (resp.status === 401 && !rotaDeAuth) {
      limparToken();
      irParaLogin();
      return new Promise(() => {});
    }
    return resp;
  };

  async function sair() {
    try {
      if ("serviceWorker" in navigator) {
        const registro = await navigator.serviceWorker.getRegistration();
        const inscricao = registro && (await registro.pushManager.getSubscription());
        if (inscricao) {
          // desvincula este navegador da conta antes de perder o token
          await fetch("/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: inscricao.endpoint }),
          });
        }
      }
    } catch {}
    limparToken();
    location.replace("/login");
  }

  window.Auth = { lerToken, salvarToken, limparToken, sair };

  if (!lerToken()) irParaLogin();
})();
