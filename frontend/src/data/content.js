import { Gem, Sparkles, ShieldCheck, Truck, RotateCcw, User, Gift, PackageCheck } from "lucide-react";

// Lightweight placeholder-image helper (swap for real photography post-launch —
// replace with your CDN/S3 URLs, or wire up the Banners admin section).
export const img = (seed, w = 900, h = 1200) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
export const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const OCCASIONS = ["Wedding", "Reception", "Festive Wear", "Mehendi", "Sangeet", "Party Wear", "Office Elegance", "Casual Grace"];

export const FABRICS = [
  { name: "Silk", seed: "fab-silk" }, { name: "Banarasi Silk", seed: "fab-banarasi" },
  { name: "Kanjivaram Silk", seed: "fab-kanji" }, { name: "Organza", seed: "fab-organza" },
  { name: "Chiffon", seed: "fab-chiffon" }, { name: "Georgette", seed: "fab-georgette" },
  { name: "Linen", seed: "fab-linen" }, { name: "Tissue", seed: "fab-tissue" },
];

export const TESTIMONIALS = [
  { name: "Ritika Sharma", city: "Mumbai", rating: 5, text: "My bridal Kanjivaram from Aaradhya's Creation was the most precious gift I gave myself. The zari work, the drape, the weight of the silk — every guest asked where it was from." },
  { name: "Anushka Rao", city: "Hyderabad", rating: 5, text: "I have bought four sarees over two years and each one arrived wrapped like a jewel. The Banarasi is now my mother's favourite too — she wears it every Diwali." },
  { name: "Devika Menon", city: "Bengaluru", rating: 5, text: "The styling support team helped me choose the right drape and blouse design for my reception. It felt like having a personal stylist, not just a store." },
];

export const GALLERY = ["ig1", "ig2", "ig3", "ig4", "ig5", "ig6"];

export const WHY_US = [
  { icon: Gem, title: "Pure Quality Fabrics", text: "Hand-verified silk, zari and weaves." },
  { icon: Sparkles, title: "Handcrafted Detailing", text: "Every border finished by artisan hand." },
  { icon: ShieldCheck, title: "Secure Checkout", text: "Bank-grade encryption, always." },
  { icon: Truck, title: "Worldwide Shipping", text: "Delivered safely, anywhere you are." },
  { icon: RotateCcw, title: "Easy Returns", text: "7-day hassle-free return window." },
  { icon: User, title: "Bridal Styling Support", text: "One-on-one drape & blouse consults." },
  { icon: Gift, title: "Premium Packaging", text: "Wrapped in signature gold silk boxes." },
  { icon: PackageCheck, title: "Exclusive Festive Edits", text: "Limited drops, never mass-produced." },
];
