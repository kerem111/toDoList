// server/index.js
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// Güvenlik: gerçek projede bu secret'ı .env'de sakla
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_dev_key";

// DB
const db = new Database("tasks.db");

// --- Tablo oluşturma (ilk çalıştırmada)
db.prepare(
  `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`
).run();

db.prepare(
  `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`
).run();

// --- Helper: JWT middleware
function authenticateToken(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ error: "No token" });

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ error: "Invalid auth format" });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // payload should contain at least { id, username }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// --- Auth: register
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username and password required" });

  const hashed = bcrypt.hashSync(password, 10);
  try {
    const info = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(username, hashed);
    const user = db
      .prepare("SELECT id, username, created_at FROM users WHERE id = ?")
      .get(info.lastInsertRowid);

    // Otomatik login: token üret
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ user, token });
  } catch (err) {
    if (
      err.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      err.code === "SQLITE_CONSTRAINT" ||
      (typeof err.message === "string" &&
        err.message.includes("UNIQUE") &&
        err.message.includes("users"))
    ) {
      return res.status(409).json({ error: "Username already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Auth: login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username and password required" });

  const row = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);
  if (!row) return res.status(401).json({ error: "Invalid credentials" });

  const valid = bcrypt.compareSync(password, row.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ user: { id: row.id, username: row.username }, token });
});

// --- Protected tasks endpoints (authenticateToken middleware kullan)
app.get("/tasks", authenticateToken, (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, text, done, created_at FROM tasks WHERE user_id = ? ORDER BY id DESC"
    )
    .all(req.user.id);
  // done'ı number olarak saklıyoruz; frontende boolean dönmek istersen maple
  res.json(rows);
});

// Create task (associate with logged-in user)
app.post("/tasks", authenticateToken, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  const info = db
    .prepare("INSERT INTO tasks (text, done, user_id) VALUES (?, 0, ?)")
    .run(text, req.user.id);
  const row = db
    .prepare("SELECT id, text, done, created_at FROM tasks WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json(row);
});

// Delete task (only if belongs to user)
app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  // ensure ownership
  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(id, req.user.id);
  if (!task) return res.status(404).json({ error: "Not found" });

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.json({ success: true });
});

// Toggle done / update text
app.patch("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { text, done } = req.body;

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(id, req.user.id);
  if (!task) return res.status(404).json({ error: "Not found" });

  const newText = typeof text === "string" ? text : task.text;
  const newDone = typeof done === "boolean" ? (done ? 1 : 0) : task.done;

  db.prepare("UPDATE tasks SET text = ?, done = ? WHERE id = ?").run(
    newText,
    newDone,
    id
  );
  const updated = db
    .prepare("SELECT id, text, done, created_at FROM tasks WHERE id = ?")
    .get(id);
  res.json(updated);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
