// app/api/accounts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow SUPER_ADMIN or SUPPLIER to see all accounts
    if (session.user.role !== "RESELLER" && session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const accounts = await db.account.findMany({
      where: {
        isDeleted: false,
        status: "AVAILABLE",
      },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        server: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        characters: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                rarity: true,
              },
            },
          },
        },
        weapons: {
          include: {
            weapon: {
              select: {
                id: true,
                name: true,
                rarity: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match the interface
    const transformedAccounts = accounts.map((account) => ({
      id: account.id,
      publicId: account.publicId,
      game: account.game,
      server: account.server,
      level: account.level,
      diamond: account.diamond,
      basePrice: account.basePrice,
      status: account.status,
      supplier: account.supplier,
      characters: account.characters.map((c) => c.character),
      weapons: account.weapons.map((w) => w.weapon),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    }));

    return NextResponse.json({ accounts: transformedAccounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
