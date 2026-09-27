import { embedText } from "@/lib/ai/gemini";
import { chunkText } from "@/lib/chunk";

export async function replaceMeetingEmbeddings(
  supabase: { from: (table: string) => any },
  meetingId: string,
  meetingTitle: string,
  transcript: string,
) {
  const chunks = chunkText(`${meetingTitle}\n${transcript}`);
  if (!chunks.length) throw new Error("Cannot index an empty meeting transcript.");

  const vectors: number[][] = [];
  for (const chunk of chunks) {
    vectors.push(await embedText(chunk));
  }

  const { error: deleteError } = await supabase.from("embeddings").delete().eq("parent_type", "meeting").eq("parent_id", meetingId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase.from("embeddings").insert(chunks.map((chunk, index) => ({
    parent_type: "meeting",
    parent_id: meetingId,
    chunk_content: chunk,
    embedding: vectors[index],
    metadata: { meeting_title: meetingTitle, source: "meeting_transcript", embedding_model: "gemini-embedding-2", embedding_dimensions: 1536 },
  })));
  if (insertError) throw insertError;
  return chunks.length;
}