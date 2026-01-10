export interface EnglishNoteDTO {
  word_id: string;
  content_md: string;
  updated_at: string;
}

function getLearningApiBaseUrl(): string {
  // Client-side env var (Next.js). Keep default for local dev.
  return process.env.NEXT_PUBLIC_LEARNING_API_BASE_URL || "http://localhost:8081";
}

export async function fetchEnglishNote(wordId: string): Promise<EnglishNoteDTO | null> {
  const res = await fetch(
    `${getLearningApiBaseUrl()}/learning/english/notes/${encodeURIComponent(wordId)}`,
    { method: "GET" }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetch note failed: ${res.status}`);

  return (await res.json()) as EnglishNoteDTO;
}

export async function upsertEnglishNote(wordId: string, contentMd: string): Promise<EnglishNoteDTO> {
  const res = await fetch(
    `${getLearningApiBaseUrl()}/learning/english/notes/${encodeURIComponent(wordId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_md: contentMd }),
    }
  );

  if (!res.ok) throw new Error(`save note failed: ${res.status}`);
  return (await res.json()) as EnglishNoteDTO;
}
