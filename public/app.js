const $ = (selector) => document.querySelector(selector);
const authView = $("#auth-view");
const accountView = $("#account-view");
const feedback = $("#feedback");

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("error", isError);
}

function setTab(tab) {
  const registering = tab === "register";
  $("#register-form").classList.toggle("hidden", !registering);
  $("#login-form").classList.toggle("hidden", registering);
  $("#tab-register").classList.toggle("active", registering);
  $("#tab-login").classList.toggle("active", !registering);
  $("#tab-register").setAttribute("aria-selected", String(registering));
  $("#tab-login").setAttribute("aria-selected", String(!registering));
  showFeedback("");
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No se pudo completar la operación.");
  return data;
}

function showAccount(user) {
  authView.classList.add("hidden");
  accountView.classList.remove("hidden");
  $("#account-name").textContent = user.displayName;
  $("#account-code").textContent = user.code;
}

function showAuth() {
  accountView.classList.add("hidden");
  authView.classList.remove("hidden");
}

$("#tab-register").addEventListener("click", () => setTab("register"));
$("#tab-login").addEventListener("click", () => setTab("login"));

$("#register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button[type=submit]");
  button.disabled = true;
  showFeedback("Creando tu cuenta…");
  try {
    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({
        displayName: $("#register-name").value.trim(),
        password: $("#register-password").value
      })
    });
    $("#register-password").value = "";
    showAccount(data.user);
    showFeedback(data.message || "Cuenta creada correctamente.");
  } catch (error) {
    showFeedback(error.message, true);
  } finally {
    button.disabled = false;
  }
});

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button[type=submit]");
  button.disabled = true;
  showFeedback("Verificando tus datos…");
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        code: $("#login-code").value.trim().toUpperCase(),
        password: $("#login-password").value
      })
    });
    $("#login-password").value = "";
    showAccount(data.user);
    showFeedback("Sesión iniciada.");
  } catch (error) {
    showFeedback(error.message, true);
  } finally {
    button.disabled = false;
  }
});

$("#copy-code").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#account-code").textContent);
    showFeedback("Código copiado.");
  } catch {
    showFeedback("No se pudo copiar automáticamente. Seleccioná el código.", true);
  }
});

$("#logout-button").addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST", body: "{}" });
    showAuth();
    setTab("login");
  } catch (error) {
    showFeedback(error.message, true);
  }
});

(async function restoreSession() {
  try {
    const data = await api("/api/me");
    showAccount(data.user);
  } catch {
    showAuth();
  }
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
