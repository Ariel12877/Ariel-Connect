const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const helmet = require("helmet");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const { rateLimit } = require("express-rate-limit");

const PORT = Number(process.env.PORT || 3000);
const DATABASE_URL = process.env.DATABASE_URL;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL. Configurá PostgreSQL antes de iniciar Ariel Connect.");
  process.exit(1);
}
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error("SESSION_SECRET debe existir y tener al menos 32 caracteres.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: true } : undefined
});

const app = express();
const server = http.createServer(app);
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", "data:"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  }
}));
app.use(express.json({ limit: "16kb" }));
app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  name: "ariel.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Esperá unos minutos y probá nuevamente." }
});

app.use(express.static(path.join(__dirname, "..", "public"), {
  extensions: ["html"],
  maxAge: isProduction ? "1h" : 0
}));

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function verifyPassword(password, stored) {
  const [salt, keyHex] = String(stored || "").split(":");
  if (!salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1 }, (error, key) => {
      if (error) return reject(error);
      resolve(key);
    });
  });
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Iniciá sesión para continuar." });
  next();
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, app: "Ariel Connect", stage: "0.2.0", database: "connected" });
  } catch {
    res.status(503).json({ ok: false, database: "unavailable" });
  }
});

app.post("/api/register", authLimiter, async (req, res, next) => {
  try {
    const displayName = String(req.body?.displayName || "").trim().replace(/\s+/g, " ");
    const password = String(req.body?.password || "");

    if (displayName.length < 2 || displayName.length > 40) {
      return res.status(400).json({ error: "El nombre debe tener entre 2 y 40 caracteres." });
    }
    if (password.length < 12 || password.length > 200) {
      return res.status(400).json({ error: "La contraseña debe tener entre 12 y 200 caracteres." });
    }

    const passwordHash = await hashPassword(password);
    let user;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = "AC-" + crypto.randomBytes(5).toString("hex").toUpperCase();
      try {
        const result = await pool.query(
          `INSERT INTO users (code, display_name, password_hash)
           VALUES ($1, $2, $3)
           RETURNING code, display_name, created_at`,
          [code, displayName, passwordHash]
        );
        user = result.rows[0];
        break;
      } catch (error) {
        if (error.code !== "23505") throw error;
      }
    }
    if (!user) return res.status(503).json({ error: "No se pudo generar un código. Intentá nuevamente." });

    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.user = { code: user.code, displayName: user.display_name };
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        res.status(201).json({
          user: { code: user.code, displayName: user.display_name },
          message: "Guardá tu código y contraseña en un lugar seguro."
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/login", authLimiter, async (req, res, next) => {
  try {
    const code = normalizeCode(req.body?.code);
    const password = String(req.body?.password || "");
    if (!/^AC-[A-F0-9]{10}$/.test(code) || !password) {
      return res.status(400).json({ error: "Revisá el código y la contraseña." });
    }

    const result = await pool.query(
      "SELECT code, display_name, password_hash FROM users WHERE code = $1",
      [code]
    );
    const user = result.rows[0];
    const valid = user ? await verifyPassword(password, user.password_hash) : false;
    if (!valid) return res.status(401).json({ error: "Código o contraseña incorrectos." });

    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.user = { code: user.code, displayName: user.display_name };
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        res.json({ user: req.session.user });
      });
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

app.post("/api/logout", requireAuth, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("ariel.sid", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict"
    });
    res.json({ ok: true });
  });
});

// No se habilita todavía Socket.IO ni retransmisión de mensajes.
// Primero se implementará el protocolo E2EE y la autorización de conversaciones.

app.use((error, _req, res, _next) => {
  console.error("Error interno:", error.message);
  res.status(500).json({ error: "Ocurrió un error interno. Intentá más tarde." });
});

server.listen(PORT, () => {
  console.log(`Ariel Connect 0.2.0 escuchando en el puerto ${PORT}`);
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
