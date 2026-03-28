import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { weapons } = await req.json();

    if (!weapons || !Array.isArray(weapons)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;

    for (const weapon of weapons) {
      // Check if weapon already exists with same name and gameId
      const existing = await db.weapon.findFirst({
        where: {
          name: weapon.name,
          gameId: weapon.gameId,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create new weapon
      await db.weapon.create({
        data: {
          name: weapon.name,
          gameId: weapon.gameId,
          rarity: weapon.rarity,
          weaponType: weapon.weaponType,
          element: weapon.element,
        },
      });

      imported++;
    }

    return NextResponse.json({
      imported,
      skipped,
      total: weapons.length,
    });
  } catch (error) {
    console.error("Error importing weapons:", error);
    return NextResponse.json(
      { error: "Failed to import weapons" },
      { status: 500 }
    );
  }
}
