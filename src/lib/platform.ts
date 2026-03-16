import { db } from './db';

// Get or create platform settings
export async function getPlatformSettings() {
  let settings = await db.platformSettings.findFirst();

  if (!settings) {
    // Create default settings if not exists
    settings = await db.platformSettings.create({
      data: {
        platformFee: 20, // Default 20%
      },
    });
  }

  return settings;
}

// Calculate platform fee amount
export function calculatePlatformFee(basePrice: number, platformFeePercent: number): number {
  return Math.ceil(basePrice * (platformFeePercent / 100));
}

// Calculate final price for reseller (base price + platform fee)
export function calculateResellerPrice(basePrice: number, platformFeePercent: number): number {
  return basePrice + calculatePlatformFee(basePrice, platformFeePercent);
}

/**
 * Calculate effective platform fee after tier discount
 * Tier discount reduces the platform fee percentage
 * Example: Platform fee 20%, Tier discount 10% => Effective fee = 10%
 */
export function calculateEffectivePlatformFee(
  basePlatformFee: number,
  tierDiscountPercent: number
): number {
  const effectiveFee = basePlatformFee - tierDiscountPercent;
  // Ensure fee is not negative (minimum 0%)
  return Math.max(0, effectiveFee);
}

/**
 * Calculate reseller price with tier discount on platform fee
 * Returns: { effectiveFeePercent, platformFeeAmount, finalPrice, savings }
 */
export function calculateResellerPriceWithTier(
  basePrice: number,
  basePlatformFee: number,
  tierDiscountPercent: number
): {
  effectiveFeePercent: number;
  platformFeeAmount: number;
  finalPrice: number;
  savings: number;
  originalFeeAmount: number;
} {
  const originalFeeAmount = calculatePlatformFee(basePrice, basePlatformFee);
  const effectiveFeePercent = calculateEffectivePlatformFee(basePlatformFee, tierDiscountPercent);
  const platformFeeAmount = calculatePlatformFee(basePrice, effectiveFeePercent);
  const finalPrice = basePrice + platformFeeAmount;
  const savings = originalFeeAmount - platformFeeAmount;

  return {
    effectiveFeePercent,
    platformFeeAmount,
    finalPrice,
    savings,
    originalFeeAmount,
  };
}

// Release pending balances that are due
export async function releasePendingBalances(userId: string) {
  const now = new Date();

  const pendingBalances = await db.pendingBalanceRecord.findMany({
    where: {
      userId,
      status: 'PENDING',
      releaseDate: { lte: now },
    },
  });

  if (pendingBalances.length === 0) {
    return { released: 0, count: 0 };
  }

  const totalAmount = pendingBalances.reduce((sum, pb) => sum + pb.amount, 0);

  // Use transaction to update everything atomically
  await db.$transaction(async (tx) => {
    // Update each pending balance status
    for (const pb of pendingBalances) {
      await tx.pendingBalanceRecord.update({
        where: { id: pb.id },
        data: {
          status: 'RELEASED',
          releasedAt: now,
        },
      });
    }

    // Add to user's sales balance
    await tx.user.update({
      where: { id: userId },
      data: {
        salesBalance: { increment: totalAmount },
        pendingBalance: { decrement: totalAmount },
      },
    });

    // Create balance log
    await tx.balanceLog.create({
      data: {
        userId,
        amount: totalAmount,
        type: 'SALES_RELEASED',
        description: `Released ${pendingBalances.length} pending balance(s)`,
      },
    });
  });

  return { released: totalAmount, count: pendingBalances.length };
}
