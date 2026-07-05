import mammoth from "mammoth";

/**
 * Extracts plain text from an uploaded file buffer based on its extension.
 * Supports: .pdf, .docx, .txt, .md
 */
export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf": {
      // Lazy import: pdf-parse touches the filesystem on import in some
      // versions, so we only load it when actually parsing a PDF.
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return result.text;
    }
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "txt":
    case "md":
      return buffer.toString("utf-8");
    default:
      throw new Error(
        `Unsupported file type ".${ext}". Supported: .pdf, .docx, .txt, .md`
      );
  }
}
