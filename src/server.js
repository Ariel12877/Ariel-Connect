const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// DEMO: los usuarios se guardan en memoria y se pierden al reiniciar.
const users = new Map();

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "Ariel Connect", stage: "prototype" });
});

app.post("/api/register", (req, res) => {
  const displayName = String(req.body?.displayName || "").trim().slice(0, 40);
  if (!displayName) {
    return res.status(400).json({ error: "Ingresá un nombre." });
  }

  const code = "AC-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const user = { code, displayName, createdAt: new Date().toISOString() };
  users.set(code, user);
  return res.status(201).json({ user });
});

app.get("/api/users/:code", (req, res) => {
  const user = users.get(String(req.params.code).toUpperCase());
  if (!user) {
    return res.status(404).json({ error: "Código no encontrado en esta demo." });
  }
  return res.json({ user: { code: user.code, displayName: user.displayName } });
});

// Transporte de demostración: NO cifra, autentica ni garantiza privacidad.
io.on("connection", (socket) => {
  socket.on("demo:join", (room) => {
    if (typeof room === "string" && /^[A-Z0-9_-]{3,40}$/.test(room)) {
      socket.join(room);
    }
  });

  socket.on("demo:packet", ({ room, payload } = {}) => {
    if (
      typeof room !== "string" ||
      typeof payload !== "string" ||
      payload.length > 12000
    ) return;

    socket.to(room).emit("demo:packet", payload);
  });
});

server.listen(PORT, () => {
  console.log(`Ariel Connect escuchando en el puerto ${PORT}`);
});
