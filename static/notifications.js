(function injetarMetaPwa() {
  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "/manifest.json";
  document.head.appendChild(manifest);

  const themeColor = document.createElement("meta");
  themeColor.name = "theme-color";
  themeColor.content = "#0f172a";
  document.head.appendChild(themeColor);

  const appleTouchIcon = document.createElement("link");
  appleTouchIcon.rel = "apple-touch-icon";
  appleTouchIcon.href = "/static/icon-192.png";
  document.head.appendChild(appleTouchIcon);

  const appleCapable = document.createElement("meta");
  appleCapable.name = "apple-mobile-web-app-capable";
  appleCapable.content = "yes";
  document.head.appendChild(appleCapable);
})();

function base64UrlParaUint8Array(base64Url) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
  return array;
}

const btnNotificacoes = document.createElement("button");
btnNotificacoes.id = "btn-notificacoes";
btnNotificacoes.type = "button";
btnNotificacoes.title = "Notificações";
btnNotificacoes.className =
  "fixed bottom-6 left-6 w-14 h-14 rounded-full bg-slate-900 border border-slate-700 text-xl leading-none " +
  "flex items-center justify-center shadow-lg hover:bg-slate-800 active:scale-95 transition z-10";
btnNotificacoes.textContent = "🔔";
document.body.appendChild(btnNotificacoes);

function atualizarEstadoBotao() {
  if (!("Notification" in window)) {
    btnNotificacoes.title = "Notificações não suportadas neste navegador";
    btnNotificacoes.classList.add("opacity-40");
    btnNotificacoes.disabled = true;
    return;
  }

  if (Notification.permission === "granted") {
    btnNotificacoes.classList.add("bg-[color:var(--accent)]", "text-white", "border-[color:var(--accent)]");
    btnNotificacoes.title = "Notificações ativadas";
  } else if (Notification.permission === "denied") {
    btnNotificacoes.classList.add("opacity-40");
    btnNotificacoes.title = "Notificações bloqueadas — ative nas configurações do navegador";
  } else {
    btnNotificacoes.title = "Ativar notificações";
  }
}

async function ativarNotificacoes() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    alert("Este navegador não suporta notificações push.");
    return;
  }

  const registration = await navigator.serviceWorker.register("/service-worker.js");

  const permissao = await Notification.requestPermission();
  atualizarEstadoBotao();
  if (permissao !== "granted") return;

  const resp = await fetch("/push/public-key");
  const { publicKey } = await resp.json();
  if (!publicKey) {
    alert("Servidor sem chave VAPID configurada.");
    return;
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlParaUint8Array(publicKey),
    });
  }

  await fetch("/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  btnNotificacoes.classList.add("bg-[color:var(--accent)]", "text-white", "border-[color:var(--accent)]");
}

btnNotificacoes.addEventListener("click", ativarNotificacoes);
atualizarEstadoBotao();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch(() => {});
}

// Se o navegador já tem permissão e inscrição (ex.: outra conta usava este aparelho),
// vincula a inscrição à conta logada agora, sem pedir nada ao usuário.
async function sincronizarInscricao() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await fetch("/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch {}
}
sincronizarInscricao();
