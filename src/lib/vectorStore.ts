import fs from "fs";
import path from "path";
import type { DocumentMeta, VectorChunk } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "vectors.json");
const DOCS_FILE = path.join(DATA_DIR, "documents.json");

interface StoreShape {
  chunks: VectorChunk[];
  documents: DocumentMeta[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load(): StoreShape {
  ensureDataDir();
  if (!fs.existsSync(STORE_FILE) || !fs.existsSync(DOCS_FILE)) {
    return { chunks: [], documents: [] };
  }
  try {
    const chunks = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
    const documents = JSON.parse(fs.readFileSync(DOCS_FILE, "utf-8"));
    return { chunks, documents };
  } catch {
    return { chunks: [], documents: [] };
  }
}

function save(store: StoreShape) {
  ensureDataDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store.chunks));
  fs.writeFileSync(DOCS_FILE, JSON.stringify(store.documents, null, 2));
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function addDocument(meta: DocumentMeta, chunks: VectorChunk[]) {
  const store = load();
  store.documents.push(meta);
  store.chunks.push(...chunks);
  save(store);
}

export function listDocuments(): DocumentMeta[] {
  return load().documents.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function deleteDocument(docId: string) {
  const store = load();
  store.documents = store.documents.filter((d) => d.id !== docId);
  store.chunks = store.chunks.filter((c) => c.docId !== docId);
  save(store);
}

export interface SearchResult extends VectorChunk {
  score: number;
}

export function search(queryEmbedding: number[], topK = 4): SearchResult[] {
  const { chunks } = load();
  return chunks
    .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function isEmpty(): boolean {
  return load().chunks.length === 0;
}
