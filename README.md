# DocuChat AI

Chat with your own PDF, DOCX, TXT, or Markdown files using a fully local,
free, open-source Retrieval-Augmented Generation (RAG) stack. No API keys,
no cloud LLM bill, no data leaving your machine.

> this project intentionally covers a different slice of the stack: local LLM
> integration, embeddings, vector search, and token streaming — rather than
> SaaS billing and dashboards.

## Why this project

Most "AI chatbot" portfolio projects call a paid API and stop there. This one
is meant to demonstrate the parts that actually separate a resume line from
real understanding:

- **Retrieval, not memorization.** Answers are grounded in excerpts pulled
  from the documents you actually uploaded, with the retrieved chunks shown
  to the user (not just claimed).
- **Streaming end to end.** Tokens are streamed from Ollama to the API route
  to the browser via a raw `ReadableStream`, with no framework streaming
  helper hiding the mechanics.
- **A vector store built from scratch.** Instead of bolting on Pinecone or
  Chroma, `src/lib/vectorStore.ts` implements cosine-similarity search over a
  JSON-persisted array directly, with a comment explaining exactly where
  you'd swap it for pgvector/Chroma if this needed to scale past one laptop.
- **Zero paid dependencies.** Every model runs locally through
  [Ollama](https://ollama.com); there's no `OPENAI_API_KEY` anywhere in this
  codebase.

## Tech stack

| Layer            | Choice                                             |
|------------------|-----------------------------------------------------|
| Framework        | Next.js 14 (App Router) + TypeScript                 |
| LLM runtime      | [Ollama](https://ollama.com) (local, free)           |
| Chat model       | `llama3.2` (swappable via env var)                   |
| Embedding model  | `nomic-embed-text`                                   |
| Vector store     | Custom cosine-similarity store, JSON-persisted       |
| State management | Zustand                                              |
| Styling          | Tailwind CSS                                         |
| Document parsing | `pdf-parse`, `mammoth` (docx), native (`txt`/`md`)   |

## Architecture

```
Upload → parseDocument() → chunkText() → embed() [Ollama] → vectorStore
Question → embed() [Ollama] → vectorStore.search() → top-k chunks
         → prompt with context → streamChat() [Ollama] → SSE-like stream → UI
```

Every document you upload is: parsed to plain text → split into overlapping
~220-word chunks → embedded via Ollama → stored alongside its embedding in
`data/vectors.json`. Every question you ask is embedded the same way, matched
against stored chunks by cosine similarity, and the top 4 matches are stuffed
into the model's context window before it answers — the standard RAG loop,
implemented without a framework like LangChain so every step is visible.

## Prerequisites

1. **Node.js 18+** — [nodejs.org](https://nodejs.org)
2. **Ollama** — [ollama.com/download](https://ollama.com/download) (free, runs on macOS/Windows/Linux)

## Setup (local, free, ~10 minutes)

### 1. Install Ollama and pull the two models

```bash
# After installing Ollama from ollama.com, pull the models this app uses:
ollama pull llama3.2
ollama pull nomic-embed-text
```

`llama3.2` (about 2GB) generates answers; `nomic-embed-text` (about 275MB)
generates embeddings for retrieval. Both run entirely on your CPU/GPU — no
account, no API key.

> Laptop with limited RAM? Swap `llama3.2` for a smaller model like `phi3` or
> `qwen2.5:3b` in `.env.local` (see step 3) — quality drops slightly but it'll
> run on 8GB of RAM.

### 2. Start Ollama

```bash
ollama serve
```

Leave this running in a terminal (on macOS/Windows the desktop app does this
for you automatically after install). Verify it's up:

```bash
curl http://localhost:11434
# should return: "Ollama is running"
```

### 3. Install and configure the app

```bash
npm install
cp .env.local.example .env.local
```

The defaults in `.env.local` already point at `http://localhost:11434` with
`llama3.2` + `nomic-embed-text` — edit only if you changed model names above.

### 4. Run it

```bash
npm run dev
```

Open **http://localhost:3000**, upload a PDF/DOCX/TXT/MD file from the left
panel, wait for it to finish embedding (a few seconds for a couple of pages),
then ask a question in the chat panel.

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/route.ts     # parse → chunk → embed → store
│   │   ├── chat/route.ts       # embed query → retrieve → stream answer
│   │   └── documents/route.ts  # list / delete uploaded documents
│   ├── layout.tsx
│   ├── page.tsx                # main UI: sidebar + chat
│   └── globals.css
├── components/
│   ├── UploadDropzone.tsx
│   ├── DocumentList.tsx
│   ├── ChatWindow.tsx          # streaming fetch + input box
│   └── MessageBubble.tsx       # renders answer + expandable source excerpts
├── lib/
│   ├── ollama.ts                # fetch-based client: embeddings + streaming chat
│   ├── vectorStore.ts           # cosine-similarity search, JSON-persisted
│   ├── chunker.ts                # overlapping word-chunk splitter
│   ├── parseDocument.ts          # pdf/docx/txt/md → plain text
│   └── types.ts
└── store/
    └── useChatStore.ts          # Zustand: messages, documents, streaming state
```

## Known limitations (and why)

- **Brute-force vector search.** Fine up to a few thousand chunks on a single
  machine; would need a real vector database (pgvector/Chroma/Pinecone)
  beyond that. The `vectorStore.ts` module is written so that swap only
  touches one file.
- **Single-user, file-based storage.** No auth, no multi-tenant isolation —
  this is a local tool, not a deployed SaaS. (See PulsaMetrics for an example
  of this project handling auth/billing instead.)
- **Word-count chunking, not token-count.** Keeps the chunker dependency-free;
  a production system would chunk by actual model tokens.

## Optional: free public demo (no local install for visitors)

If you want a live demo link for your portfolio instead of "clone and run
locally," swap the local Ollama calls in `src/lib/ollama.ts` for
[Groq](https://groq.com)'s free-tier API (fast, hosts open-source models like
Llama 3.3, no cost at low volume), then deploy:

- Frontend: [Vercel](https://vercel.com) (free tier)
- Vector storage: [Supabase](https://supabase.com) free tier (has `pgvector`
  built in) instead of the local JSON file

That swap is intentionally isolated to `lib/ollama.ts` and `lib/vectorStore.ts`
so it doesn't touch the rest of the app.

## License
