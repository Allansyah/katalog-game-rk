import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role, AccountStatus, ActivityAction } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = token.role as Role;
    const userId = token.id as string;

    let stats: Record<string, unknown> = {};

    // Helper untuk mengambil Activity Log dengan deskripsi yang human-readable
    const getRecentActivity = async (userIdFilter?: string) => {
      const logs = await db.activityLog.findMany({
        where: userIdFilter ? { userId: userIdFilter } : {},
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      return logs.map((log) => {
        let description = "";
        switch (log.action) {
          case ActivityAction.LOGIN:
            description = `${log.user?.name || "User"} logged in`;
            break;
          case ActivityAction.ACCOUNT_CREATE:
            description = `Created account: ${log.entityName}`;
            break;
          case ActivityAction.ACCOUNT_EXTRACT:
            description = `Extracted account: ${log.entityName}`;
            break;
          case ActivityAction.TOPUP_REQUEST:
            description = `Requested topup of Rp ${(log.details
              ? JSON.parse(log.details).amount
              : 0
            ).toLocaleString()}`;
            break;
          case ActivityAction.WITHDRAW_REQUEST:
            description = `Requested withdrawal`;
            break;
          case ActivityAction.TOPUP_APPROVE:
            description = `Topup approved`;
            break;
          default:
            description = `Performed ${log.action}`;
        }
        return {
          id: log.id,
          description,
          type: log.action,
          createdAt: log.createdAt,
          user: log.user?.name,
        };
      });
    };

    // --- RESELLER ---
    if (role === Role.RESELLER) {
      const [user, pendingWithdrawals, recentActivity] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: {
            balance: true,
            totalSpent: true,
            tier: { select: { name: true, discountPercent: true } },
            _count: { select: { purchases: true } },
          },
        }),
        db.withdrawalRequest.count({
          where: { userId, status: "PENDING" },
        }),
        getRecentActivity(userId),
      ]);

      stats = {
        balance: user?.balance || 0,
        totalSpent: user?.totalSpent || 0,
        totalPurchases: user?._count.purchases || 0,
        tier: user?.tier,
        pendingWithdrawals, // Jumlah penarikan yang belum diproses
        recentActivity,
      };
    }

    // --- SUPPLIER ---
    if (role === Role.SUPPLIER) {
      const [accounts, pendingEarnings, recentActivity, user] =
        await Promise.all([
          db.account.findMany({
            where: { supplierId: userId, isDeleted: false },
            select: { status: true, basePrice: true, level: true },
          }),
          db.pendingBalanceRecord.aggregate({
            where: { userId, status: "PENDING" },
            _sum: { amount: true },
          }),
          getRecentActivity(userId),
          db.user.findUnique({
            where: { id: userId },
            select: { salesBalance: true },
          }),
        ]);

      const availableAccounts = accounts.filter(
        (a) => a.status === AccountStatus.AVAILABLE
      );
      const soldAccounts = accounts.filter(
        (a) => a.status === AccountStatus.SOLD
      );
      const lockedAccounts = accounts.filter(
        (a) => a.status === AccountStatus.LOCKED
      );

      stats = {
        totalAccounts: accounts.length,
        availableAccounts: availableAccounts.length,
        lockedAccounts: lockedAccounts.length,
        soldAccounts: soldAccounts.length,
        salesBalance: user?.salesBalance || 0, // Saldo siap cair
        pendingEarnings: pendingEarnings._sum.amount || 0, // Saldo nunggu 7 hari
        totalValue: accounts.reduce((sum, a) => sum + a.basePrice, 0),
        recentActivity,
      };
    }

    // --- SUPER_ADMIN ---
    if (role === Role.SUPER_ADMIN) {
      const [
        users,
        accounts,
        games,
        transactions,
        pendingTopups,
        pendingWithdrawals,
        platformEarnings,
        recentActivity,
      ] = await Promise.all([
        db.user.findMany({ select: { role: true, isBanned: true } }),
        db.account.findMany({
          where: { isDeleted: false },
          select: { basePrice: true, status: true },
        }),
        db.game.findMany({ where: { status: true } }),
        db.transaction.findMany({
          select: { finalPrice: true, platformFee: true },
        }),
        db.topupRequest.findMany({ where: { status: "PENDING" } }),
        db.withdrawalRequest.findMany({ where: { status: "PENDING" } }),
        db.platformEarning.aggregate({ _sum: { amount: true } }),
        getRecentActivity(), // Ambil semua aktivitas
      ]);

      const totalPlatformFee = transactions.reduce(
        (sum, t) => sum + t.platformFee,
        0
      );

      stats = {
        totalUsers: users.length,
        totalSuppliers: users.filter((u) => u.role === Role.SUPPLIER).length,
        totalResellers: users.filter((u) => u.role === Role.RESELLER).length,
        bannedUsers: users.filter((u) => u.isBanned).length,
        totalAccounts: accounts.length,
        activeGames: games.length,
        totalTransactions: transactions.length,
        platformVolume: transactions.reduce((sum, t) => sum + t.finalPrice, 0),
        platformEarnings: platformEarnings._sum.amount || 0,
        pendingTopups: pendingTopups.reduce((sum, t) => sum + t.amount, 0), // Total uang masuk yang pending
        pendingWithdrawalsCount: pendingWithdrawals.length,
        recentActivity,
      };
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
