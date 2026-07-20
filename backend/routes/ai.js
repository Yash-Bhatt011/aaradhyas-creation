const express = require("express");
const axios   = require("axios");
const { read } = require("../db");

const router = express.Router();

router.post("/style", async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Graceful mock when key not configured
    return res.json({
      reply: "I'm your personal saree styling advisor! To enable AI-powered recommendations, please add your ANTHROPIC_API_KEY to the backend .env file. Once configured, I can recommend the perfect saree for any occasion, budget, or preference!"
    });
  }

  const { messages, products: clientProducts } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages[] required" });
  }

  const db = read();
  const products = (db.products || []).filter(p => p.active).map(p => ({
    id: p.id, name: p.name, fabric: p.fabric, collection: p.collection,
    price: p.price, mrp: p.mrp, rating: p.rating, stock: p.stock, featured: p.featured
  }));

  const system = `You are Aaradhya, a luxury personal saree styling advisor for Aaradhya's Creation — a heritage atelier of fine handwoven sarees based in Surat, India, established in 2009.

Your personality: warm, knowledgeable, elegant, passionate about Indian textile heritage. You speak in a refined yet approachable tone — like a trusted friend who also happens to be an expert.

Current product catalogue (${products.length} sarees available):
${JSON.stringify(products, null, 2)}

Your role:
- Help customers find the perfect saree for their occasion, skin tone, budget, and personal style
- Recommend specific products from the catalogue by name (always mention the price)
- Explain WHY a particular saree suits them — fabric properties, occasion suitability, drape style
- Share brief stories about the craft tradition behind each fabric (Banarasi, Kanjivaram, Organza etc.)
- If asked about something not in the catalogue, explain what to look for and suggest the closest match
- Keep responses warm and concise (2-4 short paragraphs max)
- Use elegant language — this is a luxury brand, not a mass-market store
- Occasionally use beautiful Indian words/phrases naturally (e.g. "Shubh", "the loom's finest work")
- Never be pushy or salesy — be a trusted advisor

If a customer shares their: occasion, skin tone, budget, or style preference — give a specific, personalised recommendation right away.`;

  try {
    const { data } = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      },
      {
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    );
    const reply = data.content?.[0]?.text || "Let me help you find your perfect saree!";
    res.json({ reply });
  } catch (e) {
    console.error("AI route error:", e.response?.data || e.message);
    res.status(500).json({ error: "AI service temporarily unavailable" });
  }
});

module.exports = router;
