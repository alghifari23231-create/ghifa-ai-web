import { NextResponse } from "next/server";
import { fileToBase64, runGeminiInteraction } from "../../../../lib/gemini/interactions";
import type { AffiliateReferenceRole, AffiliateSceneImageResponse } from "../../../../lib/affiliate/scene-types";

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_ASPECT_RATIOS = new Set(["9:16", "16:9", "1:1"]);
const ALLOWED_RESOLUTIONS = new Set(["1080p", "2K", "4K"]);
const ROLES: AffiliateReferenceRole[] = ["character", "product", "background"];

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) return error("GEMINI_API_KEY belum dikonfigurasi di server.", 500);

    const form = await request.formData();
    const prompt = String(form.get("prompt") || "").trim();
    const sceneNumber = Number(form.get("sceneNumber") || 0);
    const aspectRatio = String(form.get("aspectRatio") || "9:16");
    const resolution = String(form.get("resolution") || "1080p");

    const roleReferences = ROLES.flatMap((role) => {
      const files = form.getAll(`reference_${role}`).filter((item): item is File => item instanceof File);
      return files.map((file) => ({ role, file }));
    });

    // Backward-compatible fallback for older clients that still submit `reference`.
    // The client-side order is character -> product -> background, so each image
    // receives an explicit semantic role before it reaches Gemini.
    const genericReferences = form.getAll("reference").filter((item): item is File => item instanceof File);
    const references = roleReferences.length > 0
      ? roleReferences
      : genericReferences.slice(0, ROLES.length).map((file, index) => ({ role: ROLES[index], file }));

    if (!prompt) return error("Image prompt wajib diisi.");
    if (!Number.isInteger(sceneNumber) || sceneNumber < 1) return error("Scene number tidak valid.");
    if (!ALLOWED_ASPECT_RATIOS.has(aspectRatio)) return error("Aspect ratio tidak didukung.");
    if (!ALLOWED_RESOLUTIONS.has(resolution)) return error("Resolution tidak didukung.");
    if (references.length === 0) return error("Minimal satu reference image wajib dikirim.");
    if (references.length > 3) return error("Maksimum tiga reference image per scene.");

    for (const { file } of references) {
      if (!ALLOWED_TYPES.has(file.type)) return error("Reference hanya boleh JPG, PNG, atau WEBP.");
      if (file.size > MAX_FILE_SIZE) return error("Ukuran setiap reference maksimum 15 MB.");
    }

    const referenceBlocks = await Promise.all(references.map(async ({ role, file }) => ({
      type: "image" as const,
      data: await fileToBase64(file),
      mime_type: file.type,
      role,
    })));

    const systemInstruction = `Generate Scene ${sceneNumber} as one complete photorealistic scene image for AQU.AI Affiliate Pro.

The supplied images are visual references, not images to paste into the result. Each image has an explicit semantic role. Use the role mapping below before interpreting the images:
- CHARACTER REFERENCE: preserve the visible human identity and appearance only.
- PRODUCT REFERENCE: preserve the exact visible product identity, design and physical properties only.
- BACKGROUND REFERENCE: preserve the visible environment and spatial design only.

REFERENCE ROLE MAPPING:
${referenceBlocks.map((block) => `- ${block.role.toUpperCase()}: one supplied reference image`).join("\n")}

IDENTITY LOCK:
- Preserve the character's face, visible facial structure, skin appearance, hair/hijab, body proportions, clothing and accessories from the CHARACTER reference when supplied.
- Preserve the exact visible product design, shape, colors, markings, materials/finish and proportions from the PRODUCT reference when supplied.
- Preserve the visible environment, spatial layout, furniture, surfaces, colors and lighting cues from the BACKGROUND reference when supplied.
- Do not transfer visual traits from one role to another.
- Do not invent or substitute unrelated objects.
- Do not collage, split-screen, duplicate, overlay, watermark, or paste the references.
- The output must look like a real photograph captured in the described scene.
- Natural anatomy, skin texture, hands, fingers, eyes, teeth, hair and fabric physics. No plastic skin or AI-perfect anatomy.

COMPOSITION:
${prompt}

OUTPUT:
One complete scene image only. No text, captions, UI, borders, storyboard labels, or reference-image collage.`;

    const result = await runGeminiInteraction({
      model: MODEL,
      input: [...referenceBlocks.map(({ type, data, mime_type }) => ({ type, data, mime_type })), { type: "text", text: systemInstruction }],
      responseFormat: {
        type: "image",
        mime_type: "image/jpeg",
        aspect_ratio: aspectRatio,
        image_size: resolution === "4K" ? "4K" : resolution === "2K" ? "2K" : "1K",
      },
    });

    if (!result.output_image?.data) return error("Gemini Image tidak mengembalikan gambar.", 502);

    const response: AffiliateSceneImageResponse = {
      sceneNumber,
      model: MODEL,
      mimeType: result.output_image.mime_type || "image/jpeg",
      imageBase64: result.output_image.data,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (cause) {
    console.error("Affiliate Scene Image error", cause);
    return error(cause instanceof Error ? cause.message : "Scene image generation gagal.", 502);
  }
}
