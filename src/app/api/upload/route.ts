import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { parseDocument } from "@/lib/parseDocument";
import { chunkText } from "@/lib/chunker";
import { embedBatch, OllamaConnectionError } from "@/lib/ollama";
import { addDocument } from "@/lib/vectorStore";
import type { DocumentMeta, VectorChunk } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parseDocument(buffer, file.name);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No extractable text found in this file" },
        { status: 422 }
      );
    }

    const rawChunks = chunkText(text);
    if (rawChunks.length === 0) {
      return NextResponse.json(
        { error: "Document produced zero chunks" },
        { status: 422 }
      );
    }

    const embeddings = await embedBatch(rawChunks);

    const docId = uuidv4();
    const now = new Date().toISOString();

    const vectorChunks: VectorChunk[] = rawChunks.map((chunkText, i) => ({
      id: uuidv4(),
      docId,
      filename: file.name,
      text: chunkText,
      embedding: embeddings[i],
      chunkIndex: i,
    }));

    const meta: DocumentMeta = {
      id: docId,
      filename: file.name,
      chunkCount: vectorChunks.length,
      createdAt: now,
      sizeBytes: buffer.byteLength,
    };

    addDocument(meta, vectorChunks);

    return NextResponse.json({ document: meta });
  } catch (err) {
    if (err instanceof OllamaConnectionError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error(err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
