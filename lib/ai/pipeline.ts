import { embedText, extractActions as extractGeminiActions, summarizeTranscript as summarizeGeminiTranscript } from '@/lib/ai/gemini';
import { transcribeLocalAudio } from '@/lib/ai/whisper';
import type { AISummary, AIActionItem } from '@/types/domain';

export async function summarizeTranscript(transcript: string): Promise<AISummary> {
  const result = await summarizeGeminiTranscript(transcript);
  return {
    executive_summary: result.executive_summary ?? '',
    key_points: Array.isArray(result.key_points) ? result.key_points : [],
    risks: Array.isArray(result.risks) ? result.risks : [],
    next_steps: Array.isArray(result.next_steps) ? result.next_steps : [],
    suggested_minutes: result.suggested_minutes ?? result.executive_summary ?? '',
  };
}

export async function extractActions(transcript: string): Promise<AIActionItem[]> {
  const result = await extractGeminiActions(transcript);
  return Array.isArray(result) ? result : [];
}

export async function embed(text: string) {
  return embedText(text);
}

export async function transcribe(file: File) {
  return transcribeLocalAudio(file);
}

