// db.js — tiny file-backed JSON database.
// Good enough for a single-instance deploy; swap for Postgres/Mongo later
// by re-implementing the same get/save interface used below.
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "db.json");

const DEFAULT_DATA = {
  admins: [],
  products: [],
  collections: [],
  orders: [],
  customers: [],
  discounts: [],
  banners: [],
  settings: {},
  nextIds: { product: 1, collection: 1, order: 1000, discount: 1, banner: 1 }
};

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function read() {
  ensureFile();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("db.json is corrupted, resetting to defaults.", e);
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextId(db, key) {
  const id = db.nextIds[key] ?? 1;
  db.nextIds[key] = id + 1;
  return id;
}

module.exports = { read, write, nextId, DB_PATH };
