import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = token.role as Role;
    const userId = token.id as string;

    // 1. Ambil semua Tier, urutkan dari termurah ke termahal
    const allTiers = await db.resellerTier.findMany({
      orderBy: { minTotalSales: "asc" },
    });

    // 2. Ambil data user saat ini
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totalSpent: true,
        tierId: true,
        tier: { select: { name: true, discountPercent: true } },
        name: true,
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 3. Logic Ladder (Tangga)
    const currentTierIndex = allTiers.findIndex((t) => t.id === user.tierId);
    const currentTier = allTiers[currentTierIndex];
    const nextTier = allTiers[currentTierIndex + 1] || null;

    let progressPercent = 0;
    let currentSpentInTier = 0;
    let targetSpentForNext = 0;

    if (nextTier) {
      targetSpentForNext = nextTier.minTotalSales;
      // Hitung berapa yang sudah dihabiskan sejak awal tier ini
      // Rumus: TotalSpent - MinTierSaatIni
      const minCurrentTier = currentTier?.minTotalSales || 0;
      currentSpentInTier = user.totalSpent - minCurrentTier;

      const gapToNext = targetSpentForNext - minCurrentTier;
      progressPercent = (currentSpentInTier / gapToNext) * 100;
    } else {
      progressPercent = 100; // Max level
    }

    // 4. Ambil Leaderboard (Tangga Peringkat)
    // Ambil top 5 Reseller/Supplier berdasarkan Total Spent atau Earnings
    let leaderboard = [];

    if (role === Role.RESELLER) {
      leaderboard = await db.user.findMany({
        where: { role: Role.RESELLER, isBanned: false },
        select: {
          id: true,
          name: true,
          totalSpent: true,
          tier: { select: { name: true, color: true } },
        },
        orderBy: { totalSpent: "desc" },
        take: 5,
      });
    } else if (role === Role.SUPPLIER) {
      // Untuk supplier, leaderboard berdasarkan penjualan (total earnings yang sudah released)
      leaderboard = await db.user.findMany({
        where: { role: Role.SUPPLIER, isBanned: false },
        select: {
          id: true,
          name: true,
          salesBalance: true, // Ambil saldo penjualan sebagai proxy performa
        },
        orderBy: { salesBalance: "desc" },
        take: 5,
      });
    }

    return NextResponse.json({
      ladder: {
        allTiers,
        currentTier,
        nextTier,
        progressPercent: Math.min(progressPercent, 100).toFixed(1),
        remainingAmount: nextTier
          ? nextTier.minTotalSales - user.totalSpent
          : 0,
      },
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching ladder analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
