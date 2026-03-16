import { db } from './db';

/**
 * Calculate effective platform fee percentage after tier discount
 * Tier discount reduces the platform fee, NOT the account price
 * Example: Platform fee 20%, Tier discount 10% => Effective fee = 10%
 */
export function calculateEffectiveFee(baseFee: number, discountPercent: number): number {
  const effectiveFee = baseFee - discountPercent;
  return Math.max(0, effectiveFee); // Ensure fee is never negative
}

/**
 * Get the highest tier a user qualifies for based on totalSpent
 */
export async function getQualifiedTier(totalSpent: number) {
  const tiers = await db.resellerTier.findMany({
    orderBy: {
      minTotalSales: 'desc',
    },
  });

  for (const tier of tiers) {
    if (totalSpent >= tier.minTotalSales) {
      return tier;
    }
  }

  // Return the lowest tier (first one) if no tier qualifies
  return tiers[tiers.length - 1] || null;
}

/**
 * Update reseller tier based on totalSpent
 * Should be called after each purchase
 */
export async function updateResellerTier(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { totalSpent: true, tierId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const qualifiedTier = await getQualifiedTier(user.totalSpent);

  if (qualifiedTier && qualifiedTier.id !== user.tierId) {
    await db.user.update({
      where: { id: userId },
      data: { tierId: qualifiedTier.id },
    });
  }
}

/**
 * Get user's discount percentage based on their tier
 */
export async function getUserDiscountPercent(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { tier: true },
  });

  if (!user || !user.tier) {
    return 0;
  }

  return user.tier.discountPercent;
}

/**
 * Initialize default tiers if they don't exist
 * Tier discountPercent reduces platform fee, NOT account price
 * Bronze: 5% fee reduction, Silver: 10%, Gold: 15%, Platinum: 20%
 */
export async function initializeTiers(): Promise<void> {
  const existingTiers = await db.resellerTier.count();

  if (existingTiers === 0) {
    await db.resellerTier.createMany({
      data: [
        { name: 'Bronze', discountPercent: 5, minTotalSales: 0, color: '#CD7F32', isDefault: true },
        { name: 'Silver', discountPercent: 10, minTotalSales: 1000000, color: '#C0C0C0', isDefault: false },
        { name: 'Gold', discountPercent: 15, minTotalSales: 5000000, color: '#FFD700', isDefault: false },
        { name: 'Platinum', discountPercent: 20, minTotalSales: 10000000, color: '#E5E4E2', isDefault: false },
      ],
    });
  }
}

/**
 * Get the default tier for new users
 */
export async function getDefaultTier() {
  const defaultTier = await db.resellerTier.findFirst({
    where: { isDefault: true },
  });
  
  // If no default tier, get the one with lowest minTotalSales
  if (!defaultTier) {
    return await db.resellerTier.findFirst({
      orderBy: { minTotalSales: 'asc' },
    });
  }
  
  return defaultTier;
}
