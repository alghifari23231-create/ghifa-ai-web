import { NextResponse } from "next/server";
import { parseGeminiJson, runGeminiInteraction } from "../../../../lib/gemini/interactions";
import type { AffiliateScenePlan } from "../../../../lib/affiliate/scene-types";
import type { AffiliateSettings } from "../../../../lib/affiliate/settings";

const MODEL = process.env.GEMINI_PROMPT_MODEL || process.env.GEMINI_VISION_MODEL || "gemini-3.6-flash";

const responseSchema = {
  type: "object",
  properties: {
    finalPrompt: { type: "string" },
  },
  required: ["finalPrompt"],
};

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { settings?: AffiliateSettings; scene?: AffiliateScenePlan; referenceDNA?: unknown };
    if (!body.settings || body.settings.module !== "affiliate") return error("Affiliate settings tidak valid.");
    if (!body.scene) return error("Scene plan wajib tersedia.");

    const prompt = `Compile the final Google Flow / GEMS-compatible video prompt for one AQU.AI Affiliate Pro scene.

Do not add facts that are not supported by the supplied Reference DNA or scene plan. Keep the reference visual ground truth locked.

SETTINGS:
${JSON.stringify(body.settings, null, 2)}

REFERENCE DNA:
${JSON.stringify(body.referenceDNA || {}, null, 2)}

SCENE PLAN:
${JSON.stringify(body.scene, null, 2)}

Required prompt structure:
1. Reference identity lock using @Subject, @Product, and @Background where applicable.
2. Physical scene and composition.
3. Natural human performance and product interaction.
4. Camera, lens/shot behavior, movement, lighting, focus, FPS and stabilization.
5. Real-world motion/physics and continuity protections.
6. Dialogue using @saying only when dialog is enabled.
7. Negative continuity constraints: no face drift, body drift, product redesign, clothing/accessory changes, background changes, duplicate limbs/fingers, plastic skin, haze, collage, or reference-photo paste.

The result must be one clean production prompt, not an explanation, not JSON, and not a list of alternatives.`;

    const result = await runGeminiInteraction({
      model: MODEL,
      input: prompt,
      responseFormat: { type: "text", mime_type: "application/json", schema: responseSchema },
    });

    const parsed = parseGeminiJson<{ finalPrompt: string }>(result);
    if (!parsed.finalPrompt?.trim()) return error("Final Prompt kosong.", 502);

    return NextResponse.json({ model: MODEL, finalPrompt: parsed.finalPrompt, generatedAt: new Date().toISOString() });
  } catch (cause) {
    console.error("Affiliate Final Prompt error", cause);
    return error(cause instanceof Error ? cause.message : "Final Prompt gagal.", 502);
  }
}
