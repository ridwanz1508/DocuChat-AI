/**
 * Splits text into overlapping word-based chunks.
 *
 * Word count (not tokens) is used to keep this dependency-free — close enough
 * for a local RAG demo, where the goal is retrieval quality, not exact token
 * budgeting against a hosted model's context window.
 */
export function chunkText(
  text: string,
  chunkSize = 220,
  overlap = 40
): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(" ").trim();
    if (chunk.length > 0) chunks.push(chunk);
    if (end === words.length) break;
    start = end - overlap;
  }

  return chunks;
}
