// services/imageUpload.js
//
// Three-mode image storage, same pattern as db.js:
//   - SUPABASE_URL + SUPABASE_SERVICE_KEY set → uploads persist forever in
//     your Supabase Storage bucket. Recommended — keeps everything (data +
//     images) in one place.
//   - CLOUDINARY_URL set (and no Supabase) → uploads persist on Cloudinary's
//     free tier. Kept for anyone already using it from an earlier setup.
//   - neither set → falls back to local disk (backend/uploads/), fine for
//     local dev, but wiped on every Render free-tier redeploy.
//
// Every route calls uploadBuffer(buffer, folder) and gets back a URL string —
// this file is the only place that needs to know which backend is active.

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const USE_SUPABASE  = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const USE_CLOUDINARY = !USE_SUPABASE && !!process.env.CLOUDINARY_URL;

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "images";

let supabaseClient;
function getSupabaseClient() {
  if (!supabaseClient) {
    const { createClient } = require("@supabase/supabase-js");
    supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });
  }
  return supabaseClient;
}

let cloudinary;
if (USE_CLOUDINARY) {
  cloudinary = require("cloudinary").v2;
  // cloudinary.v2 auto-configures itself from the CLOUDINARY_URL env var.
}

// Multer stores the file in memory (a Buffer) — works identically across all modes.
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
 * @param {string} originalname - original filename, used to derive the extension
 * @returns {Promise<string>} the URL to save (Supabase/Cloudinary URL, or "/uploads/xxx" local path)
 */
async function uploadBuffer(buffer, folder, originalname) {
  const ext = path.extname(originalname).toLowerCase() || ".jpg";
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;

  if (USE_SUPABASE) {
    const supabase = getSupabaseClient();
    const filePath = `${folder}/${filename}`;
    const contentType = ext === ".png" ? "image/png"
      : ext === ".webp" ? "image/webp"
      : ext === ".gif" ? "image/gif"
      : "image/jpeg";

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, buffer, { contentType, upsert: false });

    if (error) {
      throw new Error(
        `Supabase Storage upload failed: ${error.message}. ` +
        `Make sure a public bucket named "${SUPABASE_BUCKET}" exists (Dashboard → Storage → New Bucket).`
      );
    }

    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

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
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

module.exports = { upload, uploadBuffer, USE_SUPABASE, USE_CLOUDINARY };
