"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";

export default function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { isUploading, setUploading, addDocument, setError } = useChatStore();

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      addDocument(data.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      className={`group cursor-pointer rounded-xl border border-dashed p-6 text-center transition-colors
        ${dragOver ? "border-signal-500 bg-signal-500/5" : "border-ink-600 hover:border-ink-400"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {isUploading ? (
        <div className="flex flex-col items-center gap-2 text-ink-200">
          <Loader2 className="h-6 w-6 animate-spin text-signal-500" />
          <p className="text-sm">Chunking &amp; embedding locally…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-ink-400 group-hover:text-ink-200">
          <UploadCloud className="h-6 w-6" />
          <p className="text-sm">
            Drop a file, or <span className="text-signal-500">browse</span>
          </p>
          <p className="text-xs text-ink-600 font-mono">.pdf · .docx · .txt · .md</p>
        </div>
      )}
    </div>
  );
}
