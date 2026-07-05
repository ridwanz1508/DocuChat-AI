"use client";

import { FileText, X } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList() {
  const { documents, removeDocument } = useChatStore();

  async function handleDelete(id: string) {
    removeDocument(id);
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
  }

  if (documents.length === 0) {
    return (
      <p className="text-xs text-ink-600 font-mono px-1">
        No documents yet — the archive is empty.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm"
        >
          <FileText className="h-4 w-4 shrink-0 text-signal-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-ink-100">{doc.filename}</p>
            <p className="font-mono text-[11px] text-ink-600">
              {doc.chunkCount} chunks · {formatSize(doc.sizeBytes)}
            </p>
          </div>
          <button
            onClick={() => handleDelete(doc.id)}
            aria-label={`Remove ${doc.filename}`}
            className="shrink-0 rounded p-1 text-ink-600 hover:bg-ink-700 hover:text-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
