import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { calculateEffectiveFee, getUserDiscountPercent } from "@/lib/tier";

// GET - Fetch single account details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await db.account.findFirst({
      where: {
        OR: [{ id }, { publicId: id }],
        isDeleted: false,
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
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if user is authenticated for price info
    const token = await getToken({ req: request });
    let priceInfo = {};

    if (token && token.role === Role.RESELLER) {
      const discountPercent = await getUserDiscountPercent(token.id as string);
      priceInfo = {
        basePrice: account.basePrice,
        discountPercent,
        finalPrice: calculateEffectiveFee(account.basePrice, discountPercent),
      };
    }

    return NextResponse.json({
      account: {
        id: account.id,
        publicId: account.publicId,
        game: account.game,
        level: account.level,
        diamond: account.diamond,
        serverId: account.serverId,
        server: account.server,
        gender: account.gender,
        status: account.status,
        basePrice: account.basePrice,
        characters: account.characters.map((ac) => ac.character),
        weapons: account.weapons.map((aw) => aw.weapon),
        supplier: account.supplier,
        createdAt: account.createdAt,
        priceInfo,
      },
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete account (supplier only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPPLIER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const account = await db.account.findFirst({
      where: {
        id,
        supplierId: token.id as string,
        isDeleted: false,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Soft delete
    await db.account.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

// PUT - Update account (supplier only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPPLIER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      level,
      diamond,
      serverId,
      gender,
      characterIds,
      weaponIds,
      basePrice,
      credentials,
    } = body;

    const account = await db.account.findFirst({
      where: {
        id,
        supplierId: token.id as string,
        isDeleted: false,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Validate server if provided
    if (serverId) {
      const server = await db.server.findUnique({
        where: { id: serverId },
        select: { id: true, gameId: true },
      });
      if (!server || server.gameId !== account.gameId) {
        return NextResponse.json(
          { error: "Invalid server for this game" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (level !== undefined) updateData.level = level || null;
    if (diamond !== undefined) updateData.diamond = diamond || 0;
    if (serverId !== undefined) updateData.serverId = serverId || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);

    // Update credentials if provided
    if (credentials) {
      const { encryptCredentials } = await import("@/lib/encryption");
      updateData.encryptedLogin = encryptCredentials(credentials);
    }

    // Update characters if provided
    if (characterIds !== undefined) {
      await db.accountCharacter.deleteMany({
        where: { accountId: id },
      });

      if (characterIds?.length) {
        await db.accountCharacter.createMany({
          data: characterIds.map((charId: string) => ({
            accountId: id,
            characterId: charId,
          })),
        });
      }
    }

    // Update weapons if provided
    if (weaponIds !== undefined) {
      await db.accountWeapon.deleteMany({
        where: { accountId: id },
      });

      if (weaponIds?.length) {
        await db.accountWeapon.createMany({
          data: weaponIds.map((wepId: string) => ({
            accountId: id,
            weaponId: wepId,
          })),
        });
      }
    }

    const updatedAccount = await db.account.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ account: updatedAccount });
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}
