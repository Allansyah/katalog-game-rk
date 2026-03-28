import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Helper untuk menyimpan file
async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 1. Path fisik tetap di public/uploads/characters-master
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "characters-master",
  );

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileExtension = file.name.split(".").pop();
  const fileName = `char-${uniqueSuffix}.${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  // 2. UBAH: Kembalikan URL API Route, bukan path public langsung
  return `/api/uploads/characters-master/${fileName}`;
}

// Helper untuk menghapus file
async function deleteFile(apiUrl: string | null) {
  if (!apiUrl) return;
  try {
    // 3. UBAH: Parse URL API untuk mendapatkan nama file
    // Contoh: /api/uploads/characters-master/file.jpg -> file.jpg
    const fileName = apiUrl.split("/").pop();
    if (!fileName) return;

    // Path fisik: public/uploads/characters-master/file.jpg
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "characters-master",
      fileName,
    );

    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    console.error("Failed to delete character file:", error);
  }
}

// GET (Tetap sama)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const gameId = searchParams.get("gameId");

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (gameId && gameId !== "all") {
      where.gameId = gameId;
    }

    const characters = await db.character.findMany({
      where,
      include: {
        game: { select: { id: true, name: true, code: true } },
        _count: { select: { accounts: true } },
      },
      orderBy: [{ game: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json({ characters });
  } catch (error) {
    console.error("Error fetching characters:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 },
    );
  }
}

// POST - Create (Tetap sama, tapi sekarang saveFile mengembalikan URL API)
export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request });
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const gameId = formData.get("gameId") as string;
    const name = formData.get("name") as string;
    const rarity = formData.get("rarity") as string;
    const element = formData.get("element") as string;
    const imageFile = formData.get("image") as File | null;

    if (!gameId || !name) {
      return NextResponse.json(
        { error: "Game ID and name are required" },
        { status: 400 },
      );
    }

    const existing = await db.character.findUnique({
      where: { gameId_name: { gameId, name } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Character with this name already exists in the game" },
        { status: 409 },
      );
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveFile(imageFile);
    }

    const character = await db.character.create({
      data: {
        gameId,
        name,
        imageUrl,
        rarity: rarity ? parseInt(rarity) : null,
        element: element || null,
      },
      include: {
        game: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    console.error("Error creating character:", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 },
    );
  }
}

// PUT - Update (Tetap sama, tapi deleteFile sekarang bisa handle URL API)
export async function PUT(request: Request) {
  try {
    const token = await getToken({ req: request });
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const rarity = formData.get("rarity") as string;
    const element = formData.get("element") as string;
    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage") === "true";

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 },
      );
    }

    const existingCharacter = await db.character.findUnique({
      where: { id },
    });

    if (!existingCharacter) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    // Cek duplikat nama
    if (name !== existingCharacter.name) {
      const duplicate = await db.character.findUnique({
        where: { gameId_name: { gameId: existingCharacter.gameId, name } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Character with this name already exists in the game" },
          { status: 409 },
        );
      }
    }

    let imageUrl = existingCharacter.imageUrl;

    if (removeImage) {
      await deleteFile(existingCharacter.imageUrl);
      imageUrl = null;
    } else if (imageFile && imageFile.size > 0) {
      await deleteFile(existingCharacter.imageUrl);
      imageUrl = await saveFile(imageFile);
    }

    const updated = await db.character.update({
      where: { id },
      data: {
        name,
        imageUrl,
        rarity: rarity ? parseInt(rarity) : null,
        element: element || null,
      },
      include: {
        game: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ character: updated });
  } catch (error) {
    console.error("Error updating character:", error);
    return NextResponse.json(
      { error: "Failed to update character" },
      { status: 500 },
    );
  }
}
