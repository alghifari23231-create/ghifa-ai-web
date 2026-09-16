import { NextResponse } from "next/server";
import type { ReferenceRole, VisionAnalysisResponse } from "../../../../lib/reference-intelligence/types";

const MODEL = process.env.GEMINI_VISION_MODEL || "gemini-3.6-flash";
const MAX_INLINE_BYTES = 19 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const responseSchema = {
  type: "object",
  properties: {
    summary: { type: "string", description: "Factual visual summary. Never identify a person or invent hidden details." },
    visualFacts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string" },
          value: { type: "string" },
          evidence: { type: "string", enum: ["observed", "uncertain", "not_visible"] },
        },
        required: ["field", "value", "evidence"],
      },
    },
    identityAnchors: { type: "array", items: { type: "string" } },
    continuityRules: { type: "array", items: { type: "string" } },
    forbiddenAssumptions: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "visualFacts", "identityAnchors", "continuityRules", "forbiddenAssumptions"],
};

const roleInstructions: Record<ReferenceRole, string> = {
  character: "Analyze the visible character only: face structure and visible facial features, skin appearance, hair or hijab, clothing, accessories, body proportions that are visibly supported, pose, and other stable visual identifiers. Do not infer identity, age, ethnicity, health, personality, or any hidden body detail.",
  product: "Analyze the visible product only: category if visually supported, shape, proportions, material appearance, colors, finish, labels or text that are actually readable, components, packaging, markings, and functional details visible in the image. Do not invent specifications that are not visible.",
  background: "Analyze the visible environment only: room or location type, walls, floor, furniture, windows, layout, lighting direction, light quality, colors, textures, objects, and spatial relationships. Do not invent areas outside the frame.",
  object: "Analyze the visible object only: category if visually supported, shape, dimensions relative to the frame, material appearance, color, texture, markings, components, and other stable visual identifiers. Do not invent hidden properties.",
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonError("GEMINI_API_KEY belum dikonfigurasi di server.", 500);

  const form = await request.formData();
  const file = form.get("file");
  const role = form.get("role");
  const referenceId = String(form.get("referenceId") || crypto.randomUUID());

  if (!(file instanceof File)) return jsonError("Reference image tidak ditemukan.");
  if (!ALLOWED_TYPES.has(file.type)) return jsonError("Format reference harus JPG, PNG, atau WEBP.");
  if (file.size > 15 * 1024 * 1024) return jsonError("Ukuran reference maksimum 15 MB.");
  if (!["character", "product", "background", "object"].includes(String(role))) return jsonError("Reference role tidak valid.");
  if (file.size > MAX_INLINE_BYTES) return jsonError("File terlalu besar untuk inline vision request.");

  const bytes = Buffer.from(await file.arrayBuffer());
  const imageBase64 = bytes.toString("base64");
  const normalizedRole = String(role) as ReferenceRole;

  const prompt = `You are the Reference Intelligence engine for AQU.AI. Analyze the supplied reference image as visual ground truth for downstream image/video generation. Role: ${normalizedRole}. ${roleInstructions[normalizedRole]}

Rules:
1. Only state what is visible or explicitly supported by the image.
2. Mark every visual fact as observed, uncertain, or not_visible.
3. Never turn uncertainty into a confident fact.
4. Never identify the person in the image or guess a real-world identity.
5. Never invent brand, material, measurements, colors, text, anatomy, room layout, or product functions that cannot be supported by the image.
6. Identity anchors must be stable visual characteristics that a later scene generator should preserve.
7. Continuity rules must describe what must not drift across scenes.
8. Forbidden assumptions must explicitly protect against hallucination.
9. Keep the output concise but sufficiently detailed for prompt compilation.
10. Return only the requested JSON structure.`;

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { type: "text", text: prompt },
          { type: "image", data: imageBase64, mime_type: file.type },
        ],
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: responseSchema,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Gemini Vision error", response.status, detail);
      return jsonError("Gemini Vision gagal menganalisis reference. Coba lagi.", 502);
    }

    const payload = await response.json() as { output_text?: string; text?: string };
    const raw = payload.output_text || payload.text;
    if (!raw) return jsonError("Gemini Vision tidak mengembalikan hasil analisis yang valid.", 502);

    let parsed: Omit<VisionAnalysisResponse, "referenceId" | "role" | "status" | "model" | "analyzedAt">;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Invalid Gemini JSON", raw);
      return jsonError("Hasil Vision Analysis bukan JSON yang valid.", 502);
    }

    const result: VisionAnalysisResponse = {
      referenceId,
      role: normalizedRole,
      status: "analyzed",
      model: MODEL,
      analyzedAt: new Date().toISOString(),
      dna: {
        role: normalizedRole,
        summary: parsed.summary,
        visualFacts: parsed.visualFacts,
        identityAnchors: parsed.identityAnchors,
        continuityRules: parsed.continuityRules,
        forbiddenAssumptions: parsed.forbiddenAssumptions,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Reference Vision exception", error);
    return jsonError("Terjadi error saat menghubungkan ke Gemini Vision.", 502);
  }
}
