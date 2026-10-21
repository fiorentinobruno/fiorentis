if (Auth.lerToken()) location.replace("/");

const form = document.getElementById("form");
const erro = document.getElementById("erro");
const botao = document.getElementById("enviar");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  erro.classList.add("hidden");
  botao.disabled = true;
  try {
    const resp = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("email").value,
        senha: document.getElementById("senha").value,
      }),
    });
    if (resp.ok) {
      Auth.salvarToken((await resp.json()).access_token);
      location.replace("/");
      return;
    }
    erro.textContent = resp.status === 401 ? "Email ou senha incorretos." : "Dados inválidos. Confira o email e a senha.";
  } catch {
    erro.textContent = "Não foi possível conectar ao servidor.";
  }
  erro.classList.remove("hidden");
  botao.disabled = false;
});
