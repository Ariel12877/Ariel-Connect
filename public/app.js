const $ = (id) => document.getElementById(id);
const socket = window.io ? io() : null;
const saved = localStorage.getItem("ac-demo-user");
let currentUser = saved ? JSON.parse(saved) : null;

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
function showUser(user) {
  currentUser = user;
  localStorage.setItem("ac-demo-user", JSON.stringify(user));
  $("profileName").textContent = user.displayName;
  $("profileCode").textContent = user.code;
  $("welcome").classList.add("hidden");
  $("chatPlaceholder").classList.remove("hidden");
  $("viewTitle").textContent = "Tu espacio de comunicación";
  $("viewSub").textContent = "Identidad creada · " + user.code;
  if (socket) socket.emit("identity:join", user.code);
}
if (currentUser) showUser(currentUser);

$("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const displayName = $("displayName").value.trim();
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo crear la identidad.");
    showUser(data.user);
    toast("Identidad de demostración creada: " + data.user.code);
  } catch (error) {
    toast(error.message);
  }
});

$("newChat").addEventListener("click", () => {
  if (!currentUser) return toast("Primero creá tu identidad.");
  toast("La búsqueda de contactos se incorpora en la siguiente etapa.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}