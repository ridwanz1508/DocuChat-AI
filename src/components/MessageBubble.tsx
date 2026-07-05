"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed
          ${isUser ? "bg-signal-700/20 text-ink-100" : "bg-ink-800 text-ink-100"}`}
      >
        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1">
          <ReactMarkdown>{message.content || "…"}</ReactMarkdown>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 border-t border-ink-700 pt-2">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs font-mono text-ink-400 hover:text-signal-500"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {message.sources.length} source excerpt{message.sources.length > 1 ? "s" : ""}
            </button>
            {expanded && (
              <ul className="mt-2 flex flex-col gap-2">
                {message.sources.map((s, i) => (
                  <li key={i} className="rounded-lg bg-ink-900 p-2 text-xs">
                    <p className="mb-1 font-mono text-[11px] text-amber-500">
                      [{i + 1}] {s.filename} · chunk {s.chunkIndex} · match{" "}
                      {(s.score * 100).toFixed(0)}%
                    </p>
                    <p className="highlight-mark text-ink-200 line-clamp-3">{s.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
