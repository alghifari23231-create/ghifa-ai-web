import { NextResponse } from "next/server";
import { parseGeminiJson, runGeminiInteraction } from "../../../../lib/gemini/interactions";

const MODEL = process.env.GEMINI_VISION_MODEL || "gemini-3.6-flash";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

const responseSchema = {
  type: "object",
  properties: {
    description: { type: "string", description: "Concise factual product description grounded only in supplied reference DNA and user inputs." },
    visualClaims: { type: "array", items: { type: "string" } },
    excludedClaims: { type: "array", items: { type: "string" } },
  },
  required: ["description", "visualClaims", "excludedClaims"],
};

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) return jsonError("GEMINI_API_KEY belum dikonfigurasi di server.", 500);

  let body: { productName?: string; category?: string; referenceDNA?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Request product description tidak valid.");
  }

  const productName = String(body.productName || "").trim();
  const category = String(body.category || "").trim();
  if (!productName) return jsonError("Nama produk wajib diisi.");
  if (!category) return jsonError("Kategori produk wajib dipilih.");
  if (!body.referenceDNA) return jsonError("Product Reference DNA wajib tersedia sebelum Auto Description dijalankan.");

  const prompt = `You are the Affiliate Product Description engine for AQU.AI.
Create a concise, professional product description for a video scene planner.

User input:
Product name: ${productName}
Category: ${category}

Reference DNA (visual ground truth):
${JSON.stringify(body.referenceDNA)}

Rules:
1. Reference DNA is the visual ground truth.
2. Describe only facts supported by observed visual evidence in the supplied DNA.
3. Do not invent specifications, ingredients, materials, dimensions, performance, benefits, price, certifications, brand claims, or functions.
4. If a detail is uncertain or not visible, omit it rather than guessing.
5. The description should be useful for an affiliate video scene planner, but must not become hard-selling ad copy.
6. Keep it natural and factual, 1–3 sentences.
7. Return only the requested JSON structure.`;

  try {
    const result = await runGeminiInteraction({
      model: MODEL,
      input: [{ type: "text", text: prompt }],
      responseFormat: {
        type: "text",
        mime_type: "application/json",
        schema: responseSchema,
      },
    });

    const parsed = parseGeminiJson<{ description: string; visualClaims: string[]; excludedClaims: string[] }>(result);
    if (!parsed.description || !Array.isArray(parsed.visualClaims) || !Array.isArray(parsed.excludedClaims)) {
      return jsonError("Gemini mengembalikan struktur Auto Description yang tidak lengkap.", 502);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Product Description exception", error);
    return jsonError("Terjadi error saat menghubungkan ke Gemini.", 502);
  }
}
