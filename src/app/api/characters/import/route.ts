import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { characters } = await req.json();

    if (!characters || !Array.isArray(characters)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;

    for (const char of characters) {
      // Check if character already exists with same name and gameId
      const existing = await db.character.findFirst({
        where: {
          name: char.name,
          gameId: char.gameId,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create new character
      await db.character.create({
        data: {
          name: char.name,
          gameId: char.gameId,
          rarity: char.rarity,
          element: char.element,
        },
      });

      imported++;
    }

    return NextResponse.json({
      imported,
      skipped,
      total: characters.length,
    });
  } catch (error) {
    console.error("Error importing characters:", error);
    return NextResponse.json(
      { error: "Failed to import characters" },
      { status: 500 }
    );
  }
}
