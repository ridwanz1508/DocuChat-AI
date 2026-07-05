import { create } from "zustand";
import type { ChatMessage, DocumentMeta } from "@/lib/types";

interface ChatState {
  messages: ChatMessage[];
  documents: DocumentMeta[];
  isStreaming: boolean;
  isUploading: boolean;
  error: string | null;

  setDocuments: (docs: DocumentMeta[]) => void;
  addDocument: (doc: DocumentMeta) => void;
  removeDocument: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (updater: (msg: ChatMessage) => ChatMessage) => void;
  setStreaming: (v: boolean) => void;
  setUploading: (v: boolean) => void;
  setError: (msg: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  documents: [],
  isStreaming: false,
  isUploading: false,
  error: null,

  setDocuments: (documents) => set({ documents }),
  addDocument: (doc) =>
    set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (id) =>
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (updater) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const messages = [...s.messages];
      messages[messages.length - 1] = updater(messages[messages.length - 1]);
      return { messages };
    }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setUploading: (isUploading) => set({ isUploading }),
  setError: (error) => set({ error }),
}));
