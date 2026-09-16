export type GeminiInputBlock =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mime_type: string };

type GeminiContentBlock = {
  type?: string;
  text?: string;
  data?: string;
  mime_type?: string;
};

type GeminiModelOutputStep = {
  type?: string;
  content?: GeminiContentBlock[];
};

export type GeminiInteractionResult = {
  id?: string;
  status?: string;
  model?: string;
  output_text?: string;
  output_image?: { data?: string; mime_type?: string };
  steps?: GeminiModelOutputStep[];
};

function collectModelOutput(result: GeminiInteractionResult) {
  const textParts: string[] = [];
  let image: { data?: string; mime_type?: string } | undefined;

  for (const step of result.steps ?? []) {
    if (step.type !== "model_output") continue;

    for (const block of step.content ?? []) {
      if (block.type === "text" && typeof block.text === "string") {
        textParts.push(block.text);
      }
      if (block.type === "image" && typeof block.data === "string" && !image) {
        image = {
          data: block.data,
          mime_type: block.mime_type,
        };
      }
    }
  }

  return {
    outputText: textParts.join("\n"),
    outputImage: image,
  };
}

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

  const payload = (await response.json().catch(() => null)) as GeminiInteractionResult | null;

  if (!response.ok) {
    console.error("Gemini Interaction error", response.status, payload);
    throw new Error("Gemini API gagal memproses request.");
  }

  if (!payload) throw new Error("Gemini API mengembalikan response kosong.");

  const normalized = collectModelOutput(payload);

  return {
    ...payload,
    output_text: normalized.outputText || payload.output_text,
    output_image: normalized.outputImage || payload.output_image,
  };
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
