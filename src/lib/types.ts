export interface DocumentMeta {
  id: string;
  filename: string;
  chunkCount: number;
  createdAt: string;
  sizeBytes: number;
}

export interface VectorChunk {
  id: string;
  docId: string;
  filename: string;
  text: string;
  embedding: number[];
  chunkIndex: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RetrievedSource[];
  createdAt: string;
}

export interface RetrievedSource {
  docId: string;
  filename: string;
  chunkIndex: number;
  text: string;
  score: number;
}
