// db.js — dual-mode database layer.
//
// LOCAL DEV (no MONGODB_URI set): reads/writes a JSON file at data/db.json.
// PRODUCTION (MONGODB_URI set):   persists to a free MongoDB Atlas cluster
//                                  so data survives Render redeploys/restarts.
//
// Every route file only ever calls read() / write(db) / nextId(db, key) —
// this file is the ONLY place that needs to know which storage backend is active.

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
  ads: [],
  reviews: [],
  settings: {},
  nextIds: { product: 1, collection: 1, order: 1000, discount: 1, banner: 1, ad: 1, review: 1 }
};

const USE_MONGO = !!process.env.MONGODB_URI;

/* ────────────────────────────────────────────
   MODE A: Local JSON file (no setup needed)
──────────────────────────────────────────── */
function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function readFile() {
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

function writeFile(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

/* ────────────────────────────────────────────
   MODE B: MongoDB (persists across redeploys)
──────────────────────────────────────────── */
let mongoose, StateModel;
let cachedData = null;              // in-memory copy — makes read() synchronous
let writeQueue = Promise.resolve(); // serializes writes so they never race/corrupt

async function initMongo() {
  mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGODB_URI);

  const StateSchema = new mongoose.Schema({
    _id: { type: String, default: "singleton" },
    blob: { type: mongoose.Schema.Types.Mixed, default: DEFAULT_DATA }
  }, { minimize: false });

  StateModel = mongoose.models.State || mongoose.model("State", StateSchema);

  let doc = await StateModel.findById("singleton");
  if (!doc) {
    doc = await StateModel.create({ _id: "singleton", blob: DEFAULT_DATA });
    console.log("MongoDB: created initial database document.");
  }
  cachedData = doc.blob;
  console.log("MongoDB: connected and data loaded successfully.");
}

/* Call this once from server.js/seed.js before doing anything else */
async function init() {
  if (USE_MONGO) {
    await initMongo();
  } else {
    console.log("MONGODB_URI not set — using local file storage (data/db.json).");
    console.log("On Render/Railway free tiers this data is WIPED on every redeploy.");
    console.log("Set MONGODB_URI to a free MongoDB Atlas cluster to persist data permanently.");
  }
}

/* ────────────────────────────────────────────
   Public interface — identical in both modes
──────────────────────────────────────────── */
function read() {
  if (USE_MONGO) {
    if (!cachedData) {
      throw new Error("db.init() must be awaited before read() — check server.js startup order.");
    }
    return JSON.parse(JSON.stringify(cachedData)); // deep copy, same behavior as file mode
  }
  return readFile();
}

function write(data) {
  if (USE_MONGO) {
    cachedData = data;
    // Serialize writes: each write waits for the previous one to finish saving,
    // so two fast requests in a row can never corrupt each other's data.
    writeQueue = writeQueue
      .then(() => StateModel.updateOne({ _id: "singleton" }, { blob: data }, { upsert: true }))
      .catch(err => console.error("MongoDB write failed:", err));
    return writeQueue; // callers that need to confirm the save (e.g. seed.js) can await this
  }
  writeFile(data);
  return Promise.resolve();
}

function nextId(db, key) {
  const id = db.nextIds[key] ?? 1;
  db.nextIds[key] = id + 1;
  return id;
}

async function close() {
  if (USE_MONGO && mongoose) {
    await mongoose.disconnect();
  }
}

module.exports = { init, read, write, nextId, close, DB_PATH, USE_MONGO };
