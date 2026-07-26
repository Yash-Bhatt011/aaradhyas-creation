// seed.js — manual CLI seed (run with `npm run seed`).
// NOTE: as of this version, the server also auto-seeds itself on first boot
// if it detects an empty database (see server.js) — so on Render/Railway you
// no longer need Shell access or to run this manually. This file is kept for
// local development and for deliberately re-running the seed by hand.
require("dotenv").config();
const { init, read, write, close } = require("./db");
const { runSeed } = require("./seedData");

async function seed() {
  await init(); // connects to MongoDB if MONGODB_URI is set, else no-op
  const db = read();
  await runSeed(db);
  await write(db);
  console.log("Seed complete:", {
    products: db.products.length,
    collections: db.collections.length,
    discounts: db.discounts.length,
    admins: db.admins.length
  });
  await close();
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
