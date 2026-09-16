import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "AQU.AI",
    environment: process.env.NODE_ENV || "development",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    models: {
      vision: process.env.GEMINI_VISION_MODEL || "gemini-3.6-flash",
      scene: process.env.GEMINI_SCENE_MODEL || "gemini-3.6-flash",
      prompt: process.env.GEMINI_PROMPT_MODEL || "gemini-3.6-flash",
      image: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
    },
    timestamp: new Date().toISOString(),
  });
}
