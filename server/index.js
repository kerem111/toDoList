const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("tasks.db"); // proje kökünde tasks.db oluşacak

app.use(cors());
app.use(express.json());

// Tablo oluştur (ilk çalıştırmada 1 kere)
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0
  )
`
).run();

// Tüm taskları getir
app.get("/tasks", (req, res) => {
  const rows = db.prepare("SELECT * FROM tasks").all();
  res.json(rows);
});

// Yeni task ekle
app.post("/tasks", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Task text required" });

  const result = db.prepare("INSERT INTO tasks (text) VALUES (?)").run(text);
  res.json({ id: result.lastInsertRowid, text, done: 0 });
});

// Task sil
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.json({ success: true });
});

// Task güncelle (örn: tamamlandı işaretleme)
app.patch("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { text, done } = req.body;
  db.prepare("UPDATE tasks SET text = ?, done = ? WHERE id = ?").run(
    text,
    done,
    id
  );
  res.json({ success: true });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
