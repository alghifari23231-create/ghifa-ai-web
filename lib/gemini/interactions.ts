export type GeminiInputBlock =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mime_type: string };

export type GeminiInteractionResult = {
  id?: string;
  output_text?: string;
  output_image?: { data?: string; mime_type?: string };
  steps?: unknown[];
};

export async function runGeminiInteraction(options: {
  model: string;
  input: string | GeminiInputBlock[];
  responseFormat?: Record<string, unknown>;
  previousInteractionId?: string;
}): Promise<GeminiInteractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi di server.");

  const body: Record<string, unknown> = {
    model: options.model,
    input: options.input,
  };

  if (options.responseFormat) body.response_format = options.responseFormat;
  if (options.previousInteractionId) body.previous_interaction_id = options.previousInteractionId;

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Gemini Interaction error", response.status, detail);
    throw new Error("Gemini API gagal memproses request.");
  }

  return (await response.json()) as GeminiInteractionResult;
}

export function parseGeminiJson<T>(result: GeminiInteractionResult): T {
  const raw = result.output_text;
  if (!raw) throw new Error("Gemini tidak mengembalikan output JSON.");
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("Gemini JSON parse error", raw, error);
    throw new Error("Output Gemini bukan JSON yang valid.");
  }
}

export function fileToBase64(file: File) {
  return file.arrayBuffer().then((buffer) => Buffer.from(buffer).toString("base64"));
}
