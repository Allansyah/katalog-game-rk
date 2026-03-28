import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    // Validasi keamanan: cegah path traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    // Tentukan direktori dasar tempat file disimpan (sama dengan folder upload)
    const baseDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "master-game",
    );
    const filePath = path.join(baseDir, filename);

    // Baca file
    let file: Buffer;
    try {
      file = await fs.readFile(filePath);
    } catch {
      return new NextResponse("File not found", { status: 404 });
    }

    // Tentukan content type berdasarkan ekstensi file
    const ext = path.extname(filename).toLowerCase();
    const contentType: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
    };
    const mime = contentType[ext] || "application/octet-stream";

    // Kembalikan file dengan header cache
    return new NextResponse(file, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving master-game file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
