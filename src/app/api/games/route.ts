import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role, ActivityAction } from "@prisma/client";
import { logActivityWithContext } from "@/lib/activity";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Helper function untuk menyimpan file
async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Path: public/uploads/master-game
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "master-game",
  );

  // Buat folder jika belum ada
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate nama file unik
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileExtension = file.name.split(".").pop();
  const fileName = `game-${uniqueSuffix}.${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);

  // Tulis file ke disk
  await writeFile(filePath, buffer);

  // Kembalikan path publik untuk disimpan di DB
  return `/uploads/master-game/${fileName}`;
}

// GET - List all games (Tidak berubah)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const includeRelations = searchParams.get("includeRelations") === "true";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search.toUpperCase() } },
      ];
    }

    if (includeRelations) {
      const games = await db.game.findMany({
        where,
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
            where: { status: true },
            orderBy: { name: "asc" },
          },
          _count: {
            select: {
              characters: true,
              weapons: true,
              servers: true,
              accounts: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ games });
    }

    const games = await db.game.findMany({
      where,
      include: {
        _count: {
          select: {
            characters: true,
            weapons: true,
            servers: true,
            accounts: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ games });
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 },
    );
  }
}

// POST - Create new game (Diubah untuk menangani FormData & File Upload)
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 401 },
      );
    }

    // Ubah dari request.json() ke request.formData()
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const statusStr = formData.get("status") as string;
    const iconFile = formData.get("icon") as File | null;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Game name and code are required" },
        { status: 400 },
      );
    }

    // Check if code already exists
    const existingCode = await db.game.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Game code already exists" },
        { status: 400 },
      );
    }

    // Proses upload file jika ada
    let iconPath: string | null = null;
    if (iconFile && iconFile.size > 0) {
      iconPath = await saveFile(iconFile);
    }

    const game = await db.game.create({
      data: {
        name,
        code: code.toUpperCase(),
        icon: iconPath,
        status: statusStr === "true",
      },
    });

    // Log activity
    await logActivityWithContext(
      {
        action: ActivityAction.GAME_CREATE,
        userId: token.id as string,
        entityType: "Game",
        entityId: game.id,
        entityName: game.name,
        details: {
          code: game.code,
          hasIcon: !!iconPath,
        },
      },
      request,
    );

    return NextResponse.json({ game }, { status: 201 });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 },
    );
  }
}

// PUT di file ini dihapus karena sudah dipindahkan ke [id]/route.ts
