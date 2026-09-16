import { NextResponse } from "next/server";
import { fileToBase64, runGeminiInteraction } from "../../../../lib/gemini/interactions";
import type { AffiliateSceneImageResponse } from "../../../../lib/affiliate/scene-types";

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    const files = form.getAll("reference").filter((item): item is File => item instanceof File);

    if (!prompt) return error("Image prompt wajib diisi.");
    if (!Number.isInteger(sceneNumber) || sceneNumber < 1) return error("Scene number tidak valid.");
    if (files.length === 0) return error("Minimal satu reference image wajib dikirim.");
    if (files.length > 3) return error("Maksimum tiga reference image per scene.");

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) return error("Reference hanya boleh JPG, PNG, atau WEBP.");
      if (file.size > MAX_FILE_SIZE) return error("Ukuran setiap reference maksimum 15 MB.");
    }

    const referenceBlocks = await Promise.all(files.map(async (file) => ({
      type: "image" as const,
      data: await fileToBase64(file),
      mime_type: file.type,
    })));

    const systemInstruction = `Generate Scene ${sceneNumber} as one complete photorealistic scene image for AQU.AI Affiliate Pro.

The supplied images are visual references, not images to paste into the result. Reconstruct a single coherent physical scene using their visible identity information.

IDENTITY LOCK:
- Preserve the character's face, visible facial structure, skin appearance, hair/hijab, body proportions, clothing and accessories from the character reference.
- Preserve the exact visible product design, shape, colors, markings, materials/finish and proportions from the product reference.
- Preserve the visible environment, spatial layout, furniture, surfaces, colors and lighting cues from the background reference when supplied.
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
      input: [...referenceBlocks, { type: "text", text: systemInstruction }],
      responseFormat: {
        type: "image",
        mime_type: "image/png",
        aspect_ratio: aspectRatio,
        image_size: resolution === "4K" ? "4K" : resolution === "2K" ? "2K" : "1K",
      },
    });

    if (!result.output_image?.data) return error("Gemini Image tidak mengembalikan gambar.", 502);

    const response: AffiliateSceneImageResponse = {
      sceneNumber,
      model: MODEL,
      mimeType: result.output_image.mime_type || "image/png",
      imageBase64: result.output_image.data,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (cause) {
    console.error("Affiliate Scene Image error", cause);
    return error(cause instanceof Error ? cause.message : "Scene image generation gagal.", 502);
  }
}
