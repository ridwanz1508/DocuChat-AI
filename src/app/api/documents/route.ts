import { NextRequest, NextResponse } from "next/server";
import { listDocuments, deleteDocument } from "@/lib/vectorStore";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ documents: listDocuments() });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("id");
  if (!docId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  deleteDocument(docId);
  return NextResponse.json({ ok: true });
}
