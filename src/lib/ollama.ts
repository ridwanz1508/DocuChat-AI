const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
export const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.2";
export const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

export class OllamaConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OllamaConnectionError";
  }
}

async function ollamaFetch(path: string, body: unknown) {
  let res: Response;
  try {
    res = await fetch(`${OLLAMA_HOST}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new OllamaConnectionError(
      `Can't reach Ollama at ${OLLAMA_HOST}. Is "ollama serve" running?`
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama returned ${res.status}: ${text}`);
  }
  return res;
}

/** Get a single embedding vector for a piece of text. */
export async function embed(text: string): Promise<number[]> {
  const res = await ollamaFetch("/api/embeddings", {
    model: EMBED_MODEL,
    prompt: text,
  });
  const data = (await res.json()) as { embedding: number[] };
  return data.embedding;
}

/** Embed many chunks sequentially (kept simple and predictable for a local demo). */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) {
    out.push(await embed(t));
  }
  return out;
}

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Streams a chat completion from Ollama and yields text tokens as they arrive.
 * Ollama's /api/chat streams newline-delimited JSON objects when stream=true.
 */
export async function* streamChat(messages: ChatTurn[]): AsyncGenerator<string> {
  const res = await ollamaFetch("/api/chat", {
    model: CHAT_MODEL,
    messages,
    stream: true,
  });

  if (!res.body) throw new Error("No response body from Ollama");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const json = JSON.parse(line) as {
        message?: { content?: string };
        done?: boolean;
      };
      if (json.message?.content) yield json.message.content;
    }
  }
}
