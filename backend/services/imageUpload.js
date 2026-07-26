// services/imageUpload.js
//
// Dual-mode image storage, same pattern as db.js:
//   - CLOUDINARY_URL set  → uploads persist forever on Cloudinary's free tier,
//                            survives every Render redeploy/restart.
//   - CLOUDINARY_URL unset → falls back to local disk (backend/uploads/),
//                            fine for local dev, but wiped on every Render
//                            free-tier redeploy — same limitation as before.
//
// Every route calls uploadBuffer(buffer, folder) and gets back a URL string —
// this file is the only place that needs to know which backend is active.

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const USE_CLOUDINARY = !!process.env.CLOUDINARY_URL;

let cloudinary;
if (USE_CLOUDINARY) {
  cloudinary = require("cloudinary").v2;
  // cloudinary.v2 auto-configures itself from the CLOUDINARY_URL env var.
}

// Multer stores the file in memory (a Buffer) — works identically for both modes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  }
});

/**
 * Uploads a single in-memory file buffer and returns a URL to store in the DB.
 * @param {Buffer} buffer - file.buffer from multer memoryStorage
 * @param {string} folder - "products" | "site" | "banners" | "reviews"
 * @param {string} originalname - original filename, used for local-disk extension
 * @returns {Promise<string>} the URL to save (Cloudinary URL, or "/uploads/xxx" local path)
 */
async function uploadBuffer(buffer, folder, originalname) {
  if (USE_CLOUDINARY) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `aaradhyas-creation/${folder}`, resource_type: "image" },
        (err, result) => err ? reject(err) : resolve(result.secure_url)
      );
      stream.end(buffer);
    });
  }

  // Local disk fallback
  const uploadDir = path.join(__dirname, "..", "uploads", folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const ext = path.extname(originalname).toLowerCase();
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

module.exports = { upload, uploadBuffer, USE_CLOUDINARY };
