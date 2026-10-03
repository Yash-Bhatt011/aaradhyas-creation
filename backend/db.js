// db.js — three-mode database layer.
//
// LOCAL DEV (no SUPABASE_URL, no MONGODB_URI): reads/writes a JSON file at data/db.json.
// SUPABASE (SUPABASE_URL + SUPABASE_SERVICE_KEY set): persists to a free
//   Supabase Postgres project — recommended, survives every redeploy.
// MONGODB (MONGODB_URI set, no Supabase): legacy support for existing
//   MongoDB Atlas setups from earlier versions of this project.
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

const MODE = process.env.SUPABASE_URL ? "supabase"
           : process.env.MONGODB_URI  ? "mongo"
           : "file";

const USE_SUPABASE = MODE === "supabase";
const USE_MONGO    = MODE === "mongo";

/* ────────────────────────────────────────────
   MODE: Local JSON file (no setup needed)
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
   MODE: Supabase (Postgres, recommended)
   Stores the whole app state as one JSONB row in a table called
   "app_state" — same "single document" approach as the Mongo mode below,
   just backed by Postgres. See supabase-setup.sql for the table definition.
──────────────────────────────────────────── */
let supabase;
let supaCachedData = null;
let supaWriteQueue = Promise.resolve();

async function initSupabase() {
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  const { data, error } = await supabase
    .from("app_state")
    .select("data")
    .eq("id", "singleton")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Supabase connection failed: ${error.message}. ` +
      `Did you run supabase-setup.sql in your Supabase project's SQL editor?`
    );
  }

  if (!data) {
    const { error: insertErr } = await supabase
      .from("app_state")
      .insert({ id: "singleton", data: DEFAULT_DATA });
    if (insertErr) throw new Error(`Supabase: failed to create initial row: ${insertErr.message}`);
    supaCachedData = DEFAULT_DATA;
    console.log("Supabase: created initial database row.");
  } else {
    supaCachedData = data.data;
  }
  console.log("Supabase: connected and data loaded successfully.");
}

/* ────────────────────────────────────────────
   MODE: MongoDB (legacy — kept for existing setups)
──────────────────────────────────────────── */
let mongoose, StateModel;
let mongoCachedData = null;
let mongoWriteQueue = Promise.resolve();

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
  mongoCachedData = doc.blob;
  console.log("MongoDB: connected and data loaded successfully.");
}

/* Call this once from server.js/seed.js before doing anything else */
async function init() {
  if (USE_SUPABASE) {
    await initSupabase();
  } else if (USE_MONGO) {
    await initMongo();
  } else {
    console.log("No SUPABASE_URL or MONGODB_URI set — using local file storage (data/db.json).");
    console.log("On Render/Railway free tiers this data is WIPED on every redeploy.");
    console.log("Set SUPABASE_URL + SUPABASE_SERVICE_KEY (recommended) to persist data permanently.");
  }
}

/* ────────────────────────────────────────────
   Public interface — identical across all modes
──────────────────────────────────────────── */
function read() {
  if (USE_SUPABASE) {
    if (!supaCachedData) {
      throw new Error("db.init() must be awaited before read() — check server.js startup order.");
    }
    return JSON.parse(JSON.stringify(supaCachedData)); // deep copy, same behavior as file mode
  }
  if (USE_MONGO) {
    if (!mongoCachedData) {
      throw new Error("db.init() must be awaited before read() — check server.js startup order.");
    }
    return JSON.parse(JSON.stringify(mongoCachedData));
  }
  return readFile();
}

function write(data) {
  if (USE_SUPABASE) {
    supaCachedData = data;
    // Serialize writes: each write waits for the previous one to finish saving,
    // so two fast requests in a row can never corrupt each other's data.
    supaWriteQueue = supaWriteQueue
      .then(() => supabase.from("app_state").update({ data, updated_at: new Date().toISOString() }).eq("id", "singleton"))
      .then(({ error }) => { if (error) throw error; })
      .catch(err => console.error("Supabase write failed:", err.message || err));
    return supaWriteQueue;
  }
  if (USE_MONGO) {
    mongoCachedData = data;
    mongoWriteQueue = mongoWriteQueue
      .then(() => StateModel.updateOne({ _id: "singleton" }, { blob: data }, { upsert: true }))
      .catch(err => console.error("MongoDB write failed:", err));
    return mongoWriteQueue;
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
  // Supabase's client is stateless HTTP (no persistent connection to close).
}

module.exports = {
  init, read, write, nextId, close, DB_PATH,
  USE_SUPABASE, USE_MONGO,
  MODE
};
