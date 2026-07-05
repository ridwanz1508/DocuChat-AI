import { NextRequest } from "next/server";
import { embed, streamChat, OllamaConnectionError } from "@/lib/ollama";
import { search, isEmpty } from "@/lib/vectorStore";
import type { RetrievedSource } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are DocuChat, an assistant that answers questions using ONLY the
provided context excerpts from the user's own documents. Rules:
- If the answer isn't in the context, say you don't know based on the uploaded documents.
- Never invent facts that aren't supported by the context.
- Keep answers concise and cite which document you drew from when relevant.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = (await req.json()) as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Empty message" }), {
        status: 400,
      });
    }

    if (isEmpty()) {
      return new Response(
        JSON.stringify({
          error: "No documents uploaded yet. Upload a file first.",
        }),
        { status: 422 }
      );
    }

    const queryEmbedding = await embed(message);
    const results = search(queryEmbedding, 4);

    const sources: RetrievedSource[] = results.map((r) => ({
      docId: r.docId,
      filename: r.filename,
      chunkIndex: r.chunkIndex,
      text: r.text,
      score: r.score,
    }));

    const context = results
      .map(
        (r, i) =>
          `[Excerpt ${i + 1} — ${r.filename}, chunk ${r.chunkIndex}]\n${r.text}`
      )
      .join("\n\n");

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...(history ?? []).slice(-6),
      {
        role: "user" as const,
        content: `Context excerpts:\n\n${context}\n\nQuestion: ${message}`,
      },
    ];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // First line: JSON metadata (sources) terminated by \n, so the client
        // can split "data about the answer" from "the answer text" cleanly.
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "sources", sources }) + "\n")
        );
        try {
          for await (const token of streamChat(messages)) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: "token", token }) + "\n")
            );
          }
          controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream failed";
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "error", message }) + "\n")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    if (err instanceof OllamaConnectionError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 503,
      });
    }
    const message = err instanceof Error ? err.message : "Chat failed";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
