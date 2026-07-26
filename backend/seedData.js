// seedData.js — the actual starter content, extracted so it can be reused by
// both `npm run seed` (manual CLI) and server.js (automatic first-boot seed,
// which matters most on free hosting tiers with no Shell access — the server
// seeds itself the moment it detects an empty database, no manual step needed).

const bcrypt = require("bcryptjs");

const collections = [
  { id: "bridal", title: "Bridal Sarees", sub: "Heirlooms for the big day", category:"saree", seed: "aaradhya-bridal", active: true, count: 48 },
  { id: "banarasi", title: "Banarasi Sarees", sub: "Woven on ancient looms", category:"saree", seed: "aaradhya-banarasi", active: true, count: 63 },
  { id: "kanjivaram", title: "Kanjivaram Sarees", sub: "Temple silk, South heritage", category:"saree", seed: "aaradhya-kanji", active: true, count: 37 },
  { id: "silk", title: "Pure Silk Sarees", sub: "Lustre that lasts generations", category:"saree", seed: "aaradhya-silk", active: true, count: 55 },
  { id: "organza", title: "Organza Sarees", sub: "Featherlight grandeur", category:"saree", seed: "aaradhya-organza", active: true, count: 29 },
  { id: "designer", title: "Designer Sarees", sub: "Couture, reimagined", category:"saree", seed: "aaradhya-designer", active: false, count: 18 },
  { id: "festive", title: "Festive Edit", sub: "For every shubh moment", category:"saree", seed: "aaradhya-festive", active: true, count: 42 },
  { id: "handloom", title: "Handloom Sarees", sub: "By artisan hand, thread by thread", category:"saree", seed: "aaradhya-handloom", active: true, count: 31 },
  { id: "kurti-casual", title: "Casual Kurtis", sub: "Everyday comfort, effortless style", category:"kurti", seed: "aaradhya-kurti-casual", active: true, count: 40 },
  { id: "kurti-festive", title: "Festive Kurti Sets", sub: "Zari, mirror-work & celebration", category:"kurti", seed: "aaradhya-kurti-festive", active: true, count: 22 }
];

const products = [
  { id: 1, name: "Meherunisa Banarasi", fabric: "Pure Katan Silk", category:"saree", collection: "banarasi", price: 42500, mrp: 52000, rating: 4.9, stock: 8, active: true, seed: "na1", featured: true },
  { id: 2, name: "Rajeshwari Kanjivaram", fabric: "Temple Border Silk", category:"saree", collection: "kanjivaram", price: 58900, mrp: 68000, rating: 5.0, stock: 4, active: true, seed: "na2", featured: true },
  { id: 3, name: "Anaisha Organza", fabric: "Hand-painted Organza", category:"saree", collection: "organza", price: 28750, mrp: 33500, rating: 4.8, stock: 12, active: true, seed: "na3", featured: false },
  { id: 4, name: "Vasundhara Zari", fabric: "Tissue Silk, Pure Zari", category:"saree", collection: "silk", price: 36200, mrp: 41000, rating: 4.9, stock: 6, active: true, seed: "na4", featured: true },
  { id: 5, name: "Indrani Bridal Red", fabric: "Pure Silk Zari", category:"saree", collection: "bridal", price: 64500, mrp: 75000, rating: 5.0, stock: 3, active: true, seed: "bs1", featured: true },
  { id: 6, name: "Suhana Emerald Silk", fabric: "Pure Mulberry Silk", category:"saree", collection: "silk", price: 31900, mrp: 38000, rating: 4.7, stock: 9, active: true, seed: "bs2", featured: false },
  { id: 7, name: "Padmini Georgette", fabric: "French Georgette", category:"saree", collection: "designer", price: 18750, mrp: 22000, rating: 4.6, stock: 15, active: false, seed: "bs3", featured: false },
  { id: 8, name: "Kiyara Ivory Zari", fabric: "Ivory Katan Silk", category:"saree", collection: "banarasi", price: 26400, mrp: 30000, rating: 4.8, stock: 7, active: true, seed: "bs4", featured: false },
  { id: 9,  name: "Meenal Chikankari Kurti", fabric: "Pure Cotton Chikankari", category:"kurti", collection: "kurti-casual", price: 3200, mrp: 4500, rating: 4.7, stock: 20, active: true, seed: "kur1", featured: true },
  { id: 10, name: "Zoya Zari Border Kurti", fabric: "Silk Blend", category:"kurti", collection: "kurti-festive", price: 5400, mrp: 7200, rating: 4.8, stock: 14, active: true, seed: "kur2", featured: true },
  { id: 11, name: "Riya Straight-Cut Kurti", fabric: "Rayon", category:"kurti", collection: "kurti-casual", price: 2100, mrp: 2900, rating: 4.5, stock: 25, active: true, seed: "kur3", featured: false },
  { id: 12, name: "Anvi Anarkali Kurti Set", fabric: "Georgette", category:"kurti", collection: "kurti-festive", price: 6800, mrp: 9000, rating: 4.9, stock: 9, active: true, seed: "kur4", featured: true }
];

const discounts = [
  { id: 1, code: "BRIDAL2026", type: "percentage", value: 15, maxUses: 100, uses: 48, expires: "2026-12-31", active: true },
  { id: 2, code: "FESTIVE500", type: "fixed", value: 500, maxUses: 200, uses: 120, expires: "2026-08-30", active: true },
  { id: 3, code: "WELCOME10", type: "percentage", value: 10, maxUses: null, uses: 340, expires: null, active: true },
  { id: 4, code: "DIWALI25", type: "percentage", value: 25, maxUses: 87, uses: 87, expires: "2025-11-15", active: false }
];

const defaultSettings = {
  storeName: "Aaradhya's Creation",
  tagline: "Fine Handwoven Sarees",
  contactEmail: "contact@aaradhyascreation.com",
  whatsapp: "+91 98765 43210",
  address: "Ring Road, Surat, Gujarat 395002",
  freeShippingAbove: 25000,
  standardDelivery: "5-7 business days",
  expressDelivery: "2-3 business days (₹499)",
  internationalShipping: true,
  returnWindowDays: 7,
  exchangeWindowDays: 14,
  refundMode: "Original payment method"
};

const reviews = [
  { id:1, productId:1, name:"Ritika Sharma", city:"Mumbai", rating:5, title:"Absolutely breathtaking!", text:"I ordered the Meherunisa Banarasi for my sister's wedding and every single guest asked where it was from. The zari work is incredibly fine and the silk has a gorgeous sheen. Arrived beautifully packaged too.", images:[], verified:true, createdAt:"2026-04-12T10:30:00.000Z" },
  { id:2, productId:1, name:"Devika Menon", city:"Bengaluru", rating:5, title:"Heirloom quality", text:"I have bought many Banarasi sarees over the years but this one is exceptional. The weight of the silk tells you immediately it's pure. The border motifs are crisp even up close. Worth every rupee.", images:[], verified:true, createdAt:"2026-03-22T14:15:00.000Z" },
  { id:3, productId:1, name:"Anushka Rao", city:"Hyderabad", rating:4, title:"Stunning but delivery was delayed", text:"The saree itself is absolutely gorgeous — the colour is richer in person than in the photos. Delivery took 9 days instead of the promised 7 but the quality makes up for it.", images:[], verified:false, createdAt:"2026-02-10T08:45:00.000Z" },
  { id:4, productId:2, name:"Priya Nair", city:"Chennai", rating:5, title:"Best Kanjivaram I have owned", text:"My mother wore Kanjivaram sarees her whole life and when she saw this one she said it reminded her of a saree from 30 years ago. That is the highest compliment. The temple border is immaculate.", images:[], verified:true, createdAt:"2026-05-01T11:00:00.000Z" },
  { id:5, productId:2, name:"Sneha Pillai", city:"Kochi", rating:5, title:"Wore it for my engagement — perfect!", text:"I wore the Rajeshwari Kanjivaram for my engagement ceremony and I genuinely felt like royalty. The way it drapes is perfect and the colour photographs so beautifully. Cannot recommend enough.", images:[], verified:true, createdAt:"2026-04-28T16:20:00.000Z" },
  { id:6, productId:3, name:"Meera Joshi", city:"Pune", rating:5, title:"Featherlight but still so grand", text:"I was worried an Organza saree would look too casual for a reception but this one has such beautiful hand-painted motifs that it looked absolutely festive. And it is so comfortable to wear for hours.", images:[], verified:true, createdAt:"2026-04-05T09:00:00.000Z" },
  { id:7, productId:4, name:"Kavya Reddy", city:"Surat", rating:4, title:"Tissue silk is gorgeous", text:"The silver tissue silk catches light in the most magical way. I have received so many compliments at the puja I wore it to. The zari on the pallu is especially detailed. Slight delay in shipping but the saree is worth it.", images:[], verified:false, createdAt:"2026-03-18T13:30:00.000Z" },
  { id:8, productId:5, name:"Sunita Agarwal", city:"Delhi", rating:5, title:"My bridal saree — dream come true", text:"I got married last month wearing the Indrani Bridal Red and I have never felt more beautiful. The embroidery is so intricate and every photograph looks stunning. The team at Aaradhya's also helped me choose the blouse design. Truly a once-in-a-lifetime saree.", images:[], verified:true, createdAt:"2026-05-10T07:00:00.000Z" },
];

/**
 * Populates a db object with starter content IN PLACE and returns it.
 * Only creates the admin account if one with adminEmail doesn't already exist —
 * safe to call repeatedly without duplicating or resetting real store data
 * (callers should only invoke this once, on a genuinely empty database).
 */
async function runSeed(db) {
  db.collections = collections;
  db.products = products;
  db.discounts = discounts;
  db.settings = { ...defaultSettings, ...db.settings };
  db.reviews = reviews;
  db.nextIds.review = reviews.length + 1;
  db.nextIds.product = products.length + 1;
  db.nextIds.collection = 1;
  db.nextIds.discount = discounts.length + 1;

  const adminEmail = process.env.ADMIN_EMAIL || "admin@aaradhyascreation.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";
  const existing = (db.admins || []).find(a => a.email === adminEmail);
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    db.admins = [
      ...(db.admins || []),
      { id: 1, name: "Aaradhya Admin", email: adminEmail, passwordHash, role: "owner" }
    ];
  }
  return db;
}

module.exports = { runSeed };
