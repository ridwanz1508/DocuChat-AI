"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/useChatStore";
import UploadDropzone from "@/components/UploadDropzone";
import DocumentList from "@/components/DocumentList";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  const { setDocuments, error, setError } = useChatStore();

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setDocuments(d.documents ?? []))
      .catch(() => {});
  }, [setDocuments]);

  return (
    <main className="mx-auto flex h-screen max-w-6xl flex-col p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-100">
            DocuChat <span className="text-signal-500">AI</span>
          </h1>
          <p className="text-xs font-mono text-ink-600">
            local · offline-capable · zero API cost
          </p>
        </div>
        <span className="rounded-full border border-ink-700 px-3 py-1 text-[11px] font-mono text-ink-400">
          Ollama connected
        </span>
      </header>

      {error && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            ✕
          </button>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-3 overflow-y-auto rounded-xl border border-ink-700 bg-ink-900/40 p-4">
          <h2 className="font-display text-sm text-ink-200">Archive</h2>
          <UploadDropzone />
          <DocumentList />
        </aside>

        <section className="flex min-h-0 flex-col rounded-xl border border-ink-700 bg-ink-900/40 p-4">
          <ChatWindow />
        </section>
      </div>
    </main>
  );
}
