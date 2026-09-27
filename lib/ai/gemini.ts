import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  return new Promise((resolve, reject) => {
    let lastError: unknown;
    const run = async (attempt: number) => {
      try {
        resolve(await fn());
      } catch (error) {
        lastError = error;
        if (attempt >= attempts) {
          reject(lastError instanceof Error ? lastError : new Error("Gemini request failed."));
          return;
        }
        setTimeout(() => {
          run(attempt + 1).catch(reject);
        }, 1000 * attempt);
      }
    };
    run(1).catch(reject);
  });
}

function parseGeminiJson<T>(text: string): T {
  const normalized = text.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(normalized) as T;
}

export async function transcribeAudio(file: File): Promise<string> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const response = await withRetry(async () => {
    const result = await client.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: [{
        inlineData: {
          mimeType: file.type || "audio/mpeg",
          data: buffer.toString("base64"),
        },
      }],
    } as any);
    const text = (result as any)?.text ?? (result as any)?.output_text ?? (result as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
    if (!text) throw new Error("Gemini transcription returned no text.");
    return text;
  });
  return response as string;
}

export async function summarizeTranscript(transcript: string) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");
  const response = await withRetry(async () => {
    const result = await client.models.generateContent({
      model: process.env.GEMINI_SUMMARY_MODEL || "gemini-3.8-flash",
      contents: [{
        text: `Return valid JSON with keys: executive_summary, key_points, risks, next_steps, suggested_minutes. Use only directly-supported facts from the transcript. If something is unknown, use empty arrays or empty strings. Transcript:\n${transcript}`,
      }],
    } as any);
    const text = (result as any)?.text ?? (result as any)?.output_text ?? (result as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "{}";
    const parsed = parseGeminiJson<{
      executive_summary?: string;
      key_points?: unknown;
      risks?: unknown;
      next_steps?: unknown;
      suggested_minutes?: string;
    }>(text);
    return {
      executive_summary: parsed.executive_summary ?? "",
      key_points: Array.isArray(parsed.key_points) ? parsed.key_points.filter((entry: unknown) => typeof entry === "string") : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.filter((entry: unknown) => typeof entry === "string") : [],
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps.filter((entry: unknown) => typeof entry === "string") : [],
      suggested_minutes: parsed.suggested_minutes ?? parsed.executive_summary ?? "",
    };
  });
  return response;
}

export async function extractActions(transcript: string) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");
  const response = await withRetry(async () => {
    const result = await client.models.generateContent({
      model: process.env.GEMINI_SUMMARY_MODEL || "gemini-3.8-flash",
      contents: [{
        text: `Return valid JSON with a top-level "items" array. Each object should contain: decision_text, action_item, assignee_email, due_date. Use null for unknown values. Never invent missing assignees or dates. Transcript:\n${transcript}`,
      }],
    } as any);
    const text = (result as any)?.text ?? (result as any)?.output_text ?? (result as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "{\"items\":[]}";
    const parsed = parseGeminiJson<{ items?: unknown }>(text);
    return Array.isArray(parsed.items) ? parsed.items : [];
  });
  return response;
}

export async function embedText(text: string) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");
  const result = await withRetry(async () => {
    const response = await client.models.embedContent({
      model: "gemini-embedding-2",
      contents: [{ text }],
      config: { outputDimensionality: 1536 },
    } as any);
    const embedding = (response as any)?.embeddings?.[0]?.values ?? (response as any)?.embedding?.values ?? null;
    if (!Array.isArray(embedding)) throw new Error("Gemini embedding response was empty.");
    if (embedding.length !== 1536) throw new Error(`Gemini embedding returned ${embedding.length} dimensions; expected 1536.`);
    return embedding;
  });
  return result;
}

export const withRetryGemini = withRetry;
