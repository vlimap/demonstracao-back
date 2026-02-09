const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "app.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

const allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

const initDb = async () => {
  await runAsync(
    "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))"
  );
};

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/items", async (req, res, next) => {
  try {
    const items = await allAsync("SELECT id, name, created_at FROM items ORDER BY id");
    res.json(items);
  } catch (err) {
    next(err);
  }
});

app.get("/items/:id", async (req, res, next) => {
  try {
    const item = await getAsync("SELECT id, name, created_at FROM items WHERE id = ?", [req.params.id]);
    if (!item) {
      res.status(404).json({ message: "Item não encontrado" });
      return;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

app.post("/items", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "Campo 'name' é obrigatório" });
      return;
    }

    const result = await runAsync("INSERT INTO items (name) VALUES (?)", [name]);
    const item = await getAsync("SELECT id, name, created_at FROM items WHERE id = ?", [result.lastID]);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Erro interno" });
});

const port = Number(process.env.PORT) || 3000;

const startServer = async () => {
  await initDb();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`API rodando na porta ${port}`);
      resolve(server);
    });
  });
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error("Falha ao inicializar o banco:", err);
    process.exit(1);
  });
}

module.exports = { app, initDb, startServer, db };
