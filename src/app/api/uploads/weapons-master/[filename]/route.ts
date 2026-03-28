import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    // Validasi keamanan
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    // Path fisik file ada di folder public
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "weapons-master",
      filename,
    );

    let file: Buffer;
    try {
      file = await fs.readFile(filePath);
    } catch {
      return new NextResponse("File not found", { status: 404 });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving weapon file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
