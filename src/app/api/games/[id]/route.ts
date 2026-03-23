import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role, ActivityAction } from "@prisma/client";
import { logActivityWithContext } from "@/lib/activity";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Helper: Simpan file ke folder public/uploads/master-game
async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "master-game",
  );

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileExtension = file.name.split(".").pop();
  const fileName = `game-${uniqueSuffix}.${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return `/uploads/master-game/${fileName}`;
}

// Helper: Hapus file dari public
async function deleteFile(publicPath: string | null) {
  if (!publicPath) return;
  try {
    const filePath = path.join(process.cwd(), "public", publicPath);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    console.error("Failed to delete old file:", error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const game = await db.game.findUnique({
      where: { id },
      include: {
        characters: {
          select: {
            id: true,
            name: true,
            rarity: true,
            element: true,
            imageUrl: true,
          },
          orderBy: { name: "asc" },
        },
        weapons: {
          select: {
            id: true,
            name: true,
            rarity: true,
            weaponType: true,
            imageUrl: true,
          },
          orderBy: { name: "asc" },
        },
        servers: {
          select: { id: true, name: true, code: true, status: true },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            accounts: true,
            characters: true,
            weapons: true,
            servers: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 },
    );
  }
}

// ----------------------- TAMBAHAN: UPDATE GAME -----------------------
export async function PUT(
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

    // Gunakan formData karena ada file upload
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const statusStr = formData.get("status") as string;
    const iconFile = formData.get("icon") as File | null;
    const removeIcon = formData.get("removeIcon") === "true"; // Flag dari frontend jika ingin hapus icon

    const existing = await db.game.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Cek duplikasi code jika diubah
    if (code && code.toUpperCase() !== existing.code) {
      const duplicate = await db.game.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Game code already exists" },
          { status: 400 },
        );
      }
    }

    let iconPath = existing.icon;

    // 1. Jika ada request hapus icon
    if (removeIcon) {
      await deleteFile(existing.icon);
      iconPath = null;
    }
    // 2. Jika ada file baru diupload
    else if (iconFile && iconFile.size > 0) {
      // Hapus file lama dulu
      await deleteFile(existing.icon);
      // Simpan file baru
      iconPath = await saveFile(iconFile);
    }

    const game = await db.game.update({
      where: { id },
      data: {
        name: name || existing.name,
        code: code ? code.toUpperCase() : existing.code,
        icon: iconPath,
        status:
          statusStr !== undefined ? statusStr === "true" : existing.status,
      },
    });

    await logActivityWithContext(
      {
        action: ActivityAction.GAME_UPDATE,
        userId: token.id as string,
        entityType: "Game",
        entityId: game.id,
        entityName: game.name,
        details: { changes: { name, code, updatedIcon: !!iconFile } },
      },
      request,
    );

    return NextResponse.json({ game });
  } catch (error) {
    console.error("Error updating game:", error);
    return NextResponse.json(
      { error: "Failed to update game" },
      { status: 500 },
    );
  }
}

// ----------------------- DELETE GAME -----------------------
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

    const accountsCount = await db.account.count({
      where: { gameId: id },
    });

    if (accountsCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete game with existing accounts. Disable it instead.",
        },
        { status: 400 },
      );
    }

    const game = await db.game.findUnique({
      where: { id },
      select: { name: true, code: true, icon: true }, // Ambil icon untuk dihapus juga
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Hapus data terkait
    await db.character.deleteMany({ where: { gameId: id } });
    await db.weapon.deleteMany({ where: { gameId: id } });
    await db.server.deleteMany({ where: { gameId: id } });

    // Hapus file icon
    await deleteFile(game.icon);

    // Hapus game dari DB
    await db.game.delete({ where: { id } });

    await logActivityWithContext(
      {
        action: ActivityAction.GAME_DELETE,
        userId: token.id as string,
        entityType: "Game",
        entityId: id,
        entityName: game.name,
        details: { code: game.code },
      },
      request,
    );

    return NextResponse.json({ message: "Game deleted successfully" });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { error: "Failed to delete game" },
      { status: 500 },
    );
  }
}
