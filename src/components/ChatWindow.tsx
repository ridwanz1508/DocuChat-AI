"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Send, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import MessageBubble from "./MessageBubble";
import type { RetrievedSource } from "@/lib/types";

export default function ChatWindow() {
  const {
    messages,
    isStreaming,
    setStreaming,
    addMessage,
    updateLastMessage,
    setError,
    documents,
  } = useChatStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setError(null);

    const userMsg = {
      id: uuidv4(),
      role: "user" as const,
      content: text,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);

    const assistantMsg = {
      id: uuidv4(),
      role: "assistant" as const,
      content: "",
      sources: [] as RetrievedSource[],
      createdAt: new Date().toISOString(),
    };
    addMessage(assistantMsg);
    setStreaming(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Chat request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line);
          if (evt.type === "sources") {
            updateLastMessage((m) => ({ ...m, sources: evt.sources }));
          } else if (evt.type === "token") {
            fullText += evt.token;
            updateLastMessage((m) => ({ ...m, content: fullText }));
          } else if (evt.type === "error") {
            throw new Error(evt.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      updateLastMessage((m) => ({
        ...m,
        content: m.content || "_Failed to get a response — see error below._",
      }));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-1 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-ink-600">
            <p className="font-display text-lg text-ink-400">
              {documents.length === 0
                ? "Upload a document to begin"
                : "Ask something about your documents"}
            </p>
            <p className="max-w-sm text-xs">
              Every answer is grounded in retrieved excerpts from what you uploaded —
              nothing leaves your machine.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-ink-700 pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask a question about your documents…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:border-signal-500"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-600 text-ink-950 disabled:opacity-40"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
