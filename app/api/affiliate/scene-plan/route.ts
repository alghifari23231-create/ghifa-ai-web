import { NextResponse } from "next/server";
import { runGeminiInteraction, parseGeminiJson } from "../../../../lib/gemini/interactions";
import type { AffiliateReferenceDNA, AffiliateScenePlan, AffiliateScenePlanResponse } from "../../../../lib/affiliate/scene-types";
import type { AffiliateSettings } from "../../../../lib/affiliate/settings";

const MODEL = process.env.GEMINI_SCENE_MODEL || process.env.GEMINI_VISION_MODEL || "gemini-3.6-flash";

const sceneSchema = {
  type: "object",
  properties: {
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sceneNumber: { type: "integer" },
          title: { type: "string" },
          objective: { type: "string" },
          durationSeconds: { type: "number" },
          action: { type: "string" },
          characterPerformance: { type: "string" },
          productInteraction: { type: "string" },
          camera: { type: "string" },
          lighting: { type: "string" },
          environment: { type: "string" },
          dialogue: { type: "string" },
          imagePrompt: { type: "string" },
          videoPrompt: { type: "string" },
          continuityLocks: { type: "array", items: { type: "string" } },
        },
        required: [
          "sceneNumber", "title", "objective", "durationSeconds", "action",
          "characterPerformance", "productInteraction", "camera", "lighting",
          "environment", "dialogue", "imagePrompt", "videoPrompt", "continuityLocks",
        ],
      },
    },
  },
  required: ["scenes"],
};

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { settings?: AffiliateSettings; referenceDNA?: AffiliateReferenceDNA };
    const settings = body.settings;
    const referenceDNA = body.referenceDNA;

    if (!settings || settings.module !== "affiliate") return error("Affiliate settings tidak valid.");

    const missingRoles = ["character", "product", "background"].filter(
      role => !referenceDNA?.[role as keyof AffiliateReferenceDNA],
    );
    if (missingRoles.length > 0) {
      return error(`Reference DNA belum lengkap: ${missingRoles.join(", ")}. Semua Character, Product, dan Background wajib dianalisis sebelum Scene Planner dijalankan.`);
    }

    const sceneCount = Number(settings.video.sceneCount);
    if (!Number.isInteger(sceneCount) || sceneCount < 1 || sceneCount > 30) return error("Scene count harus berada di antara 1 dan 30.");

    const plannerPrompt = `You are the Affiliate Pro Scene Planner for AQU.AI.

Create exactly ${sceneCount} scenes for a professional AI affiliate video. The scenes will later be rendered as complete images and converted into video prompts.

VISUAL GROUND TRUTH:
The supplied Reference DNA is the only authority for visible character, product, and environment details. All three references are mandatory and equally authoritative. Never invent visual facts. Preserve the same character identity, product appearance, clothing, accessories, and background continuity across every scene. The product must be visibly present from Scene 1.

REFERENCE ROLE PRIORITY:
- CHARACTER DNA controls only the visible human identity, appearance, clothing and accessories.
- PRODUCT DNA controls only the visible product identity, design, shape, material appearance, color and markings.
- BACKGROUND DNA controls only the visible environment, spatial layout, furniture, surfaces and lighting cues.
- Never transfer attributes from one reference role to another.

STYLE:
Natural creator-style storytelling. Do not write seller/TVC/hard-selling copy. The content intent is ${settings.story.contentIntent}. Video style is ${settings.story.videoStyle}.

CHARACTER SETTINGS:
${JSON.stringify(settings.character, null, 2)}

PRODUCT SETTINGS:
${JSON.stringify(settings.product, null, 2)}

VIDEO SETTINGS:
${JSON.stringify(settings.video, null, 2)}

REFERENCE DNA:
${JSON.stringify(referenceDNA, null, 2)}

SCENE RULES:
1. Each scene must have a distinct purpose and visual progression.
2. Every scene must describe a complete physical composition, not a pasted reference photo.
3. Use natural human movement, realistic body mechanics, hand/finger behavior, eye focus, facial expression, and interaction with the product.
4. Do not change face, body proportions, skin appearance, clothing, accessories, product design, product color, or environment without explicit user input.
5. Camera movement must be physically plausible and compatible with the selected camera type, shot type, movement, lighting, FPS, resolution, focus, and stabilization.
6. If dialogue is disabled, dialogue must be an empty string.
7. If dialogue is enabled, write natural ${settings.video.dialogLanguage} dialogue appropriate to the scene; do not use hard-selling claims.
8. Do not invent product specifications, benefits, price, certifications, ingredients, measurements, or performance claims unless present in the supplied reference DNA or product description.
9. The imagePrompt must be ready for a native image-generation model and must produce a complete scene image by combining the supplied Character, Product, and Background references into one physically coherent photograph. Never describe the references as objects to paste, overlay, collage, or copy literally.
10. The videoPrompt must describe motion and camera behavior for the same scene without changing visual identity.
11. Return exactly ${sceneCount} scenes and no extra prose.`;

    const result = await runGeminiInteraction({
      model: MODEL,
      input: plannerPrompt,
      responseFormat: { type: "text", mime_type: "application/json", schema: sceneSchema },
    });

    const parsed = parseGeminiJson<{ scenes: AffiliateScenePlan[] }>(result);
    if (!Array.isArray(parsed.scenes) || parsed.scenes.length !== sceneCount) {
      return error("Scene Planner mengembalikan jumlah scene yang tidak sesuai.", 502);
    }

    const scenes = parsed.scenes.map((scene, index) => ({
      ...scene,
      sceneNumber: index + 1,
      durationSeconds: settings.video.durationSeconds,
    }));

    const response: AffiliateScenePlanResponse = {
      module: "affiliate",
      model: MODEL,
      generatedAt: new Date().toISOString(),
      settings,
      scenes,
    };

    return NextResponse.json(response);
  } catch (cause) {
    console.error("Affiliate Scene Planner error", cause);
    return error(cause instanceof Error ? cause.message : "Scene Planner gagal.", 502);
  }
}
