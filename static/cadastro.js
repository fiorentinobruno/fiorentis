if (Auth.lerToken()) location.replace("/");

const form = document.getElementById("form");
const erro = document.getElementById("erro");
const botao = document.getElementById("enviar");

function mostrarErro(texto) {
  erro.textContent = texto;
  erro.classList.remove("hidden");
  botao.disabled = false;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  erro.classList.add("hidden");
  const senha = document.getElementById("senha").value;
  if (senha.length < 8) return mostrarErro("A senha precisa ter pelo menos 8 caracteres.");
  botao.disabled = true;
  try {
    const resp = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("email").value,
        senha,
        codigo_acesso: document.getElementById("codigo").value || null,
      }),
    });
    if (resp.ok) {
      Auth.salvarToken((await resp.json()).access_token);
      location.replace("/");
      return;
    }
    if (resp.status === 403) return mostrarErro("Código de acesso inválido.");
    if (resp.status === 409) return mostrarErro("Este email já está cadastrado.");
    mostrarErro("Dados inválidos. Confira o email e use uma senha de 8 a 72 caracteres.");
  } catch {
    mostrarErro("Não foi possível conectar ao servidor.");
  }
});
