import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role, AccountStatus, LogType, ActivityAction } from "@prisma/client";
import { updateResellerTier } from "@/lib/tier";
import { decryptCredentials } from "@/lib/encryption";
import {
  getPlatformSettings,
  calculateResellerPriceWithTier,
  calculatePlatformFee,
} from "@/lib/platform";
import { logActivityWithContext } from "@/lib/activity";

// POST - Extract account (purchase and get credentials)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (
      !token ||
      (token.role !== Role.RESELLER && token.role !== Role.SUPPLIER)
    ) {
      return NextResponse.json(
        { error: "Unauthorized - Reseller/Supplier only" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const buyerId = token.id as string;

    // Get platform settings
    const platformSettings = await getPlatformSettings();
    const basePlatformFee = platformSettings.platformFee;

    // Get buyer with tier
    const buyer = await db.user.findUnique({
      where: { id: buyerId },
      include: { tier: true },
    });

    if (!buyer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tierDiscountPercent = buyer.tier?.discountPercent || 0;

    // Use transaction with serializable isolation for race condition prevention
    const result = await db.$transaction(
      async (tx) => {
        // 1. Lock the account row and check availability (include server, characters, weapons)
        const account = await tx.account.findFirst({
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
          },
        });

        if (!account) {
          throw new Error("Account not found");
        }

        if (account.status !== AccountStatus.AVAILABLE) {
          throw new Error(`Account is ${account.status.toLowerCase()}`);
        }

        // 2. Check if buyer is the supplier (owner) of the account
        const isOwner = account.supplierId === buyerId;

        // 3. Calculate prices with tier discount on platform fee
        const basePrice = account.basePrice;
        const priceCalc = isOwner
          ? {
              effectiveFeePercent: 0,
              platformFeeAmount: 0,
              finalPrice: 0,
              savings: 0,
              originalFeeAmount: calculatePlatformFee(
                basePrice,
                basePlatformFee
              ),
            }
          : calculateResellerPriceWithTier(
              basePrice,
              basePlatformFee,
              tierDiscountPercent
            );

        // 4. Check balance (skip for owner)
        if (!isOwner && buyer.balance < priceCalc.finalPrice) {
          throw new Error(
            `Insufficient balance. Need Rp ${priceCalc.finalPrice.toLocaleString()}, have Rp ${buyer.balance.toLocaleString()}`
          );
        }

        // 5. Lock the account
        await tx.account.update({
          where: { id: account.id },
          data: { status: AccountStatus.LOCKED },
        });

        // 6. Create transaction record (wajib dibuat terlebih dahulu)
        const transaction = await tx.transaction.create({
          data: {
            accountId: account.id,
            resellerId: buyerId,
            basePrice,
            platformFee: priceCalc.effectiveFeePercent,
            finalPrice: priceCalc.finalPrice,
          },
        });

        // For non-owner: process payment
        if (!isOwner) {
          // 7. Deduct balance from buyer
          await tx.user.update({
            where: { id: buyerId },
            data: {
              balance: { decrement: priceCalc.finalPrice },
              totalSpent: { increment: priceCalc.finalPrice },
            },
          });

          // 8. Create pending balance for supplier (releases in 7 days)
          const releaseDate = new Date();
          releaseDate.setDate(releaseDate.getDate() + 7);

          await tx.pendingBalanceRecord.create({
            data: {
              userId: account.supplierId,
              amount: basePrice,
              transactionId: transaction.id,
              releaseDate,
              status: "PENDING",
            },
          });

          // 9. Update supplier's pending balance (for display)
          await tx.user.update({
            where: { id: account.supplierId },
            data: {
              pendingBalance: { increment: basePrice },
            },
          });

          // 10. Create platform earning record (actual fee after tier discount)
          await tx.platformEarning.create({
            data: {
              amount: priceCalc.platformFeeAmount,
              transactionId: transaction.id,
            },
          });

          // 11. Create balance logs
          await tx.balanceLog.createMany({
            data: [
              {
                userId: buyerId,
                amount: -priceCalc.finalPrice,
                type: LogType.DEDUCTION,
                description: `Purchase account ${account.publicId}`,
              },
              {
                userId: account.supplierId,
                amount: basePrice,
                type: LogType.EARNING,
                description: `Sale of account ${account.publicId} (pending 7 days)`,
              },
            ],
          });
        } else {
          // Owner extracting own account - just log it
          await tx.balanceLog.create({
            data: {
              userId: buyerId,
              amount: 0,
              type: LogType.TRANSFER,
              description: `Retrieved own account ${account.publicId}`,
            },
          });
        }

        // 12. Update account status to SOLD
        await tx.account.update({
          where: { id: account.id },
          data: { status: AccountStatus.SOLD },
        });

        // 13. Decrypt credentials
        const credentials = decryptCredentials(account.encryptedLogin);

        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + 7);

        // Format account data sesuai dengan yang diharapkan frontend
        const formattedAccount = {
          id: account.id,
          publicId: account.publicId,
          game: account.game,
          level: account.level,
          diamond: account.diamond,
          server: account.server
            ? {
                id: account.server.id,
                name: account.server.name,
                code: account.server.code,
              }
            : null,
          gender: account.gender,
          characters: account.characters.map((ac) => ({
            id: ac.character.id,
            name: ac.character.name,
            rarity: ac.character.rarity,
            quantity: ac.quantity,
          })),
          weapons: account.weapons.map((aw) => ({
            id: aw.weapon.id,
            name: aw.weapon.name,
            rarity: aw.weapon.rarity,
            quantity: aw.quantity,
          })),
        };

        return {
          account: formattedAccount,
          credentials,
          transaction: {
            basePrice,
            platformFee: priceCalc.platformFeeAmount,
            platformFeePercent: priceCalc.effectiveFeePercent,
            basePlatformFee,
            tierDiscountPercent: isOwner ? 0 : tierDiscountPercent,
            finalPrice: priceCalc.finalPrice,
            savings: priceCalc.savings,
            balanceAfter: isOwner
              ? buyer.balance
              : buyer.balance - priceCalc.finalPrice,
            releaseDate: isOwner ? null : releaseDate,
            isOwner,
            tierName: buyer.tier?.name || null,
          },
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    // Update buyer tier (outside transaction to avoid conflicts)
    await updateResellerTier(buyerId);

    // Log activity
    await logActivityWithContext(
      {
        action: ActivityAction.ACCOUNT_EXTRACT,
        userId: buyerId,
        entityType: "Account",
        entityId: result.account.id,
        entityName: result.account.publicId,
        details: {
          gameName: result.account.game.name,
          finalPrice: result.transaction.finalPrice,
          isOwner: result.transaction.isOwner,
          tierDiscount: result.transaction.tierDiscountPercent,
        },
      },
      request
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extraction error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to extract account";

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// GET - Price inquiry for extraction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (
      !token ||
      (token.role !== Role.RESELLER && token.role !== Role.SUPPLIER)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user with tier
    const user = await db.user.findUnique({
      where: { id: token.id as string },
      include: { tier: true },
    });

    const tierDiscountPercent = user?.tier?.discountPercent || 0;

    const account = await db.account.findFirst({
      where: {
        OR: [{ id }, { publicId: id }],
        isDeleted: false,
        status: AccountStatus.AVAILABLE,
      },
      include: {
        game: true,
        server: true, // include server relation
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

    if (!account) {
      return NextResponse.json(
        { error: "Account not found or not available" },
        { status: 404 }
      );
    }

    // Get platform settings
    const platformSettings = await getPlatformSettings();
    const basePlatformFee = platformSettings.platformFee;

    // Check if user is the supplier (owner) of the account
    const isOwner = account.supplierId === token.id;

    // Calculate prices with tier discount on platform fee
    const basePrice = account.basePrice;
    const priceCalc = isOwner
      ? {
          effectiveFeePercent: 0,
          platformFeeAmount: 0,
          finalPrice: 0,
          savings: 0,
          originalFeeAmount: calculatePlatformFee(basePrice, basePlatformFee),
        }
      : calculateResellerPriceWithTier(
          basePrice,
          basePlatformFee,
          tierDiscountPercent
        );

    // Format account data sesuai frontend
    const formattedAccount = {
      id: account.id,
      publicId: account.publicId,
      game: account.game,
      level: account.level,
      diamond: account.diamond,
      server: account.server
        ? {
            id: account.server.id,
            name: account.server.name,
            code: account.server.code,
          }
        : null,
      gender: account.gender,
      characters: account.characters.map((ac) => ({
        id: ac.character.id,
        name: ac.character.name,
        rarity: ac.character.rarity,
        quantity: ac.quantity,
      })),
      weapons: account.weapons.map((aw) => ({
        id: aw.weapon.id,
        name: aw.weapon.name,
        rarity: aw.weapon.rarity,
        quantity: aw.quantity,
      })),
    };

    return NextResponse.json({
      account: formattedAccount,
      pricing: {
        basePrice,
        platformFee: priceCalc.platformFeeAmount,
        platformFeePercent: priceCalc.effectiveFeePercent,
        basePlatformFee,
        tierDiscountPercent: isOwner ? 0 : tierDiscountPercent,
        finalPrice: priceCalc.finalPrice,
        savings: priceCalc.savings,
        originalPlatformFee: priceCalc.originalFeeAmount,
        balance: user?.balance || 0,
        sufficient: isOwner || (user?.balance || 0) >= priceCalc.finalPrice,
        isOwner,
        tierName: user?.tier?.name || null,
      },
    });
  } catch (error) {
    console.error("Price inquiry error:", error);
    return NextResponse.json({ error: "Failed to get price" }, { status: 500 });
  }
}
