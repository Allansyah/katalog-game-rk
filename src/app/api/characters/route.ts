import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";

// GET /api/characters?search=&gameId=
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
      { status: 500 }
    );
  }
}

// POST /api/characters (create)
export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request });
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, name, imageUrl, rarity, element } = body;

    if (!gameId || !name) {
      return NextResponse.json(
        { error: "Game ID and name are required" },
        { status: 400 }
      );
    }

    // Cek duplikat (gameId + name unique)
    const existing = await db.character.findUnique({
      where: { gameId_name: { gameId, name } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Character with this name already exists in the game" },
        { status: 409 }
      );
    }

    const character = await db.character.create({
      data: {
        gameId,
        name,
        imageUrl: imageUrl || null,
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
      { status: 500 }
    );
  }
}

// PUT /api/characters (update)
export async function PUT(request: Request) {
  try {
    const token = await getToken({ req: request });
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, imageUrl, rarity, element } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 }
      );
    }

    // Cek apakah karakter ada
    const existingCharacter = await db.character.findUnique({
      where: { id },
      include: { game: true },
    });

    if (!existingCharacter) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // Jika nama berubah, cek duplikat di game yang sama
    if (name !== existingCharacter.name) {
      const duplicate = await db.character.findUnique({
        where: { gameId_name: { gameId: existingCharacter.gameId, name } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Character with this name already exists in the game" },
          { status: 409 }
        );
      }
    }

    // Update karakter (gameId tidak boleh diubah)
    const updated = await db.character.update({
      where: { id },
      data: {
        name,
        imageUrl: imageUrl || null,
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
      { status: 500 }
    );
  }
}
