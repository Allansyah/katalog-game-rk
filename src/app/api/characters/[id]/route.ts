import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Helper untuk menghapus file
async function deleteFile(publicPath: string | null) {
  if (!publicPath) return;
  try {
    const filePath = path.join(process.cwd(), "public", publicPath);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    console.error("Failed to delete file:", error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Check if character is used in accounts
    const accountCharacters = await db.accountCharacter.count({
      where: { characterId: id },
    });

    if (accountCharacters > 0) {
      return NextResponse.json(
        { error: "Cannot delete character used in accounts" },
        { status: 400 },
      );
    }

    // Ambil info karakter untuk mendapatkan path gambar
    const character = await db.character.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    // Hapus file gambar jika ada
    if (character) {
      await deleteFile(character.imageUrl);
    }

    await db.character.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Character deleted successfully" });
  } catch (error) {
    console.error("Error deleting character:", error);
    return NextResponse.json(
      { error: "Failed to delete character" },
      { status: 500 },
    );
  }
}
