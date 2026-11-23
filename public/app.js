const form = document.querySelector("#register-form");
const result = document.querySelector("#result");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const displayName = document.querySelector("#display-name").value.trim();
  result.textContent = "Generando tu código…";

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo generar el código.");
    result.textContent = `Tu código de prueba: ${data.user.code}`;
  } catch (error) {
    result.textContent = error.message;
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
