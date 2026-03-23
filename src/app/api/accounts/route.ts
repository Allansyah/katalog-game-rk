import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { encryptCredentials, generatePublicId } from "@/lib/encryption";

// GET - Public catalog access and supplier inventory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const characters = searchParams
      .get("characters")
      ?.split(",")
      .filter(Boolean);
    const weapons = searchParams.get("weapons")?.split(",").filter(Boolean);
    const minDiamond = searchParams.get("minDiamond");
    const maxDiamond = searchParams.get("maxDiamond");
    const minLevel = searchParams.get("minLevel");
    const maxLevel = searchParams.get("maxLevel");
    const serverId = searchParams.get("serverId");
    const gender = searchParams.get("gender");
    const supplierOnly = searchParams.get("supplierOnly") === "true";
    const status = searchParams.get("status");

    // Check authentication for supplier-only view
    let token = null;
    if (supplierOnly) {
      token = await getToken({ req: request });
      if (!token || token.role !== Role.SUPPLIER) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const where: Record<string, unknown> = {};

    // Supplier inventory view
    if (supplierOnly) {
      where.supplierId = token?.id;
      where.isDeleted = false;
      if (status && status !== "all") {
        where.status = status;
      }
    } else {
      // Public catalog view
      if (!gameId) {
        return NextResponse.json(
          { error: "Game ID is required" },
          { status: 400 }
        );
      }
      where.gameId = gameId;
      where.status = "AVAILABLE";
      where.isDeleted = false;
    }

    // Search by public ID
    if (search) {
      where.publicId = { contains: search, mode: "insensitive" };
    }

    // Game filter (for supplier view)
    if (gameId && supplierOnly) {
      where.gameId = gameId;
    }

    // Diamond range filter
    if (minDiamond || maxDiamond) {
      where.diamond = {};
      if (minDiamond)
        where.diamond = { ...where.diamond, gte: parseInt(minDiamond) };
      if (maxDiamond)
        where.diamond = { ...where.diamond, lte: parseInt(maxDiamond) };
    }

    // Level range filter
    if (minLevel || maxLevel) {
      where.level = {};
      if (minLevel) where.level = { ...where.level, gte: parseInt(minLevel) };
      if (maxLevel) where.level = { ...where.level, lte: parseInt(maxLevel) };
    }

    // Server filter
    if (serverId) {
      where.serverId = serverId;
    }

    // Gender filter
    if (gender) {
      where.gender = gender;
    }

    // Character filter - accounts must have ALL selected characters (any quantity)
    if (characters && characters.length > 0) {
      where.AND = characters.map((charId) => ({
        characters: {
          some: { characterId: charId },
        },
      }));
    }

    // Weapon filter - accounts must have ALL selected weapons (any quantity)
    if (weapons && weapons.length > 0) {
      const weaponConditions = weapons.map((weaponId) => ({
        weapons: {
          some: { weaponId: weaponId },
        },
      }));

      if (where.AND) {
        where.AND = [...(where.AND as unknown[]), ...weaponConditions];
      } else {
        where.AND = weaponConditions;
      }
    }

    const [accounts, total] = await Promise.all([
      db.account.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          publicId: true,
          level: true,
          diamond: true,
          serverId: true,
          server: {
            select: { id: true, name: true, code: true },
          },
          gender: true,
          basePrice: true,
          status: true,
          createdAt: true,
          game: {
            select: { id: true, name: true, code: true },
          },
          characters: {
            select: {
              quantity: true,
              character: {
                select: { id: true, name: true, rarity: true, element: true },
              },
            },
          },
          weapons: {
            select: {
              quantity: true,
              weapon: {
                select: {
                  id: true,
                  name: true,
                  rarity: true,
                  weaponType: true,
                },
              },
            },
          },
          supplier: supplierOnly
            ? {
                select: { id: true, name: true },
              }
            : false,
        },
      }),
      db.account.count({ where }),
    ]);

    // Transform data for response
    const publicAccounts = accounts.map((account) => ({
      id: account.id,
      publicId: account.publicId,
      game: account.game,
      level: account.level,
      diamond: account.diamond,
      serverId: account.serverId,
      server: account.server,
      gender: account.gender,
      basePrice: account.basePrice,
      status: account.status,
      characters: account.characters.map((c) => ({
        ...c.character,
        quantity: c.quantity,
      })),
      weapons: account.weapons.map((w) => ({
        ...w.weapon,
        quantity: w.quantity,
      })),
      supplier: account.supplier,
      createdAt: account.createdAt,
    }));

    return NextResponse.json({
      accounts: publicAccounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create new account (Supplier only)
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPPLIER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      gameId,
      level,
      diamond,
      serverId,
      gender,
      characterSelections, // Array of { characterId, quantity }
      weaponSelections, // Array of { weaponId, quantity }
      basePrice,
      credentials,
    } = body;

    // Validate required fields
    if (!gameId || !basePrice || !credentials) {
      return NextResponse.json(
        { error: "Game, base price, and credentials are required" },
        { status: 400 }
      );
    }

    // Get game code for public ID
    const game = await db.game.findUnique({
      where: { id: gameId },
      select: { code: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Validate server if provided
    if (serverId) {
      const server = await db.server.findUnique({
        where: { id: serverId },
        select: { id: true, gameId: true },
      });
      if (!server || server.gameId !== gameId) {
        return NextResponse.json(
          { error: "Invalid server for this game" },
          { status: 400 }
        );
      }
    }

    // Generate public ID
    const publicId = generatePublicId(game.code);

    // Encrypt credentials
    const encryptedLogin = encryptCredentials(credentials);

    // Create account with relations including quantity
    const account = await db.account.create({
      data: {
        publicId,
        gameId,
        supplierId: token.id as string,
        serverId: serverId || null,
        level: level || null,
        diamond: diamond || 0,
        gender: gender || null,
        basePrice: parseFloat(basePrice),
        encryptedLogin,
        characters: characterSelections?.length
          ? {
              create: characterSelections.map(
                (item: { characterId: string; quantity: number }) => ({
                  characterId: item.characterId,
                  quantity: item.quantity || 1,
                })
              ),
            }
          : undefined,
        weapons: weaponSelections?.length
          ? {
              create: weaponSelections.map(
                (item: { weaponId: string; quantity: number }) => ({
                  weaponId: item.weaponId,
                  quantity: item.quantity || 1,
                })
              ),
            }
          : undefined,
      },
      include: {
        game: true,
        server: true,
        characters: {
          include: {
            character: true,
          },
        },
        weapons: {
          include: {
            weapon: true,
          },
        },
      },
    });

    // Transform response to include quantity
    const responseAccount = {
      ...account,
      characters: account.characters.map((c) => ({
        ...c.character,
        quantity: c.quantity,
      })),
      weapons: account.weapons.map((w) => ({
        ...w.weapon,
        quantity: w.quantity,
      })),
    };

    return NextResponse.json({ account: responseAccount }, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
