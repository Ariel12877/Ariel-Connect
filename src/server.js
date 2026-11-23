import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.PUBLIC_ORIGIN || "http://localhost:3000" }
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "../public")));

// DEMO ONLY: in-memory stores are lost when the server restarts.
// Replace with PostgreSQL and add rate limits, abuse controls and audited auth.
const users = new Map();
const groups = new Map();

function newUserCode() {
  return `AC-${randomBytes(5).toString("hex").toUpperCase()}`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "Ariel Connect", stage: "starter-demo" });
});

app.post("/api/register", (req, res) => {
  const displayName = String(req.body?.displayName || "").trim().slice(0, 40);
  if (!displayName) return res.status(400).json({ error: "Ingresá un nombre visible." });

  // The code is an identifier, NOT an authentication secret.
  const code = newUserCode();
  users.set(code, { code, displayName, createdAt: new Date().toISOString() });
  res.status(201).json({ user: users.get(code) });
});

app.get("/api/users/:code", (req, res) => {
  const user = users.get(req.params.code.toUpperCase());
  if (!user) return res.status(404).json({ error: "No se encontró ese código." });
  res.json({ user });
});

app.post("/api/groups", (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 60);
  const ownerCode = String(req.body?.ownerCode || "").toUpperCase();
  if (!name || !users.has(ownerCode)) {
    return res.status(400).json({ error: "Nombre de grupo o creador inválido." });
  }
  const id = randomBytes(12).toString("hex");
  const group = { id, name, members: [ownerCode], createdAt: new Date().toISOString() };
  groups.set(id, group);
  res.status(201).json({ group });
});

io.on("connection", (socket) => {
  socket.on("identity:join", (code) => {
    const normalized = String(code || "").toUpperCase();
    if (users.has(normalized)) socket.join(`user:${normalized}`);
  });

  // This relay accepts ciphertext-shaped payloads only by convention.
  // E2EE encryption/decryption and authenticated device sessions are NOT
  // implemented in this starter. Do not send private messages through it yet.
  socket.on("message:send", (packet, ack) => {
    if (!packet || typeof packet !== "object" ||
        typeof packet.to !== "string" ||
        typeof packet.ciphertext !== "string") {
      return ack?.({ ok: false, error: "Paquete inválido." });
    }
    io.to(`user:${packet.to.toUpperCase()}`).emit("message:new", {
      from: String(packet.from || "").slice(0, 32),
      ciphertext: packet.ciphertext,
      sentAt: new Date().toISOString()
    });
    ack?.({ ok: true, accepted: true });
  });
});

const port = Number(process.env.PORT || 3000);
httpServer.listen(port, () => {
  console.log(`Ariel Connect starter running at http://localhost:${port}`);
});