import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocuChat AI — chat with your own documents, locally",
  description:
    "A fully local, free RAG app: upload documents and ask questions answered by an open-source LLM running on your machine via Ollama.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ink-950 text-ink-100 font-body antialiased">
        {children}
      </body>
    </html>
  );
}
