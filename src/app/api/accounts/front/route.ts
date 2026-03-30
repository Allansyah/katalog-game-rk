import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const gameId = searchParams.get("gameId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const serverId = searchParams.get("serverId") || "";
    const gender = searchParams.get("gender") || "";
    const minDiamond = parseInt(searchParams.get("minDiamond") || "0");
    const maxDiamond = parseInt(searchParams.get("maxDiamond") || "999999");
    const minLevel = parseInt(searchParams.get("minLevel") || "0");
    const maxLevel = parseInt(searchParams.get("maxLevel") || "999");

    // --- PARSING FILTER QUANTITY ---
    // Format dari frontend: "id1:qty1,id2:qty2"
    const charactersParam = searchParams.get("characters");
    const weaponsParam = searchParams.get("weapons");

    const characterFilters: any[] = [];
    if (charactersParam) {
      charactersParam.split(",").forEach((item) => {
        const [id, qtyStr] = item.split(":");
        const qty = parseInt(qtyStr) || 1; // Default 1 jika tidak ada angka

        // Kita gunakan raw query atau logic NOT NONE untuk relasi
        // Pastikan akun punya karakter ini dengan quantity >= qty
        characterFilters.push({
          characters: {
            some: {
              characterId: id,
              quantity: { gte: qty }, // Filter utama di sini
            },
          },
        });
      });
    }

    const weaponFilters: any[] = [];
    if (weaponsParam) {
      weaponsParam.split(",").forEach((item) => {
        const [id, qtyStr] = item.split(":");
        const qty = parseInt(qtyStr) || 1;
        weaponFilters.push({
          weapons: {
            some: {
              weaponId: id,
              quantity: { gte: qty }, // Filter utama di sini
            },
          },
        });
      });
    }

    // Build Where Clause
    const whereClause: any = {
      gameId,
      status: "AVAILABLE", // Asumsi hanya menampilkan akun available
      // Filter dasar
      ...(search && { publicId: { contains: search } }),
      ...(serverId && { serverId }),
      ...(gender && { gender }),
      diamond: { gte: minDiamond, lte: maxDiamond },
      level: { gte: minLevel, lte: maxLevel },
      // Gabungkan filter karakter dan senjata dengan AND (harus memenuhi semua kriteria)
      AND: [...characterFilters, ...weaponFilters],
    };

    // Query Database
    const accounts = await db.account.findMany({
      where: whereClause,
      include: {
        game: { select: { name: true, code: true } },
        server: { select: { id: true, name: true, code: true } },
        // Include relasi untuk mendapatkan data quantity
        characters: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                rarity: true,

                element: true,
                imageUrl: true,
              },
            },
          },
        },
        weapons: {
          include: {
            weapon: {
              select: { id: true, name: true, rarity: true, imageUrl: true },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await db.account.count({
      where: { status: "AVAILABLE", gameId, ...whereClause },
    });

    // --- MAPPING DATA UNTUK FRONTEND ---
    // Frontend mengharapkan 'quantity' berada di dalam objek karakter/senjata
    // Sedangkan Prisma mengembalikannya di tabel penghubung (AccountCharacter)
    const formattedAccounts = accounts.map((acc) => ({
      ...acc,
      characters: acc.characters.map((c) => ({
        id: c.character.id,
        name: c.character.name,
        rarity: c.character.rarity,
        element: c.character.element,
        imageUrl: c.character.imageUrl,
        quantity: c.quantity, // Masukkan quantity ke sini agar kebaca di Frontend
      })),
      weapons: acc.weapons.map((w) => ({
        id: w.weapon.id,
        name: w.weapon.name,
        rarity: w.weapon.rarity,
        imageUrl: w.weapon.imageUrl,
        quantity: w.quantity, // Masukkan quantity ke sini
      })),
    }));

    return NextResponse.json({
      accounts: formattedAccounts,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error("Get Accounts Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
