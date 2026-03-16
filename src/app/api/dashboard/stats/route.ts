import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, AccountStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = token.role as Role;
    const userId = token.id as string;

    let stats: Record<string, unknown> = {};

    if (role === Role.RESELLER) {
      // Reseller stats
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          balance: true,
          totalSpent: true,
          tier: { select: { name: true, discountPercent: true } },
          _count: { select: { purchases: true } },
        },
      });

      const recentActivity = await db.balanceLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      stats = {
        balance: user?.balance || 0,
        totalSpent: user?.totalSpent || 0,
        totalPurchases: user?._count.purchases || 0,
        tier: user?.tier,
        recentActivity,
      };
    }

    if (role === Role.SUPPLIER) {
      // Supplier stats
      const accounts = await db.account.findMany({
        where: { supplierId: userId, isDeleted: false },
        select: { status: true, basePrice: true },
      });

      const soldAccounts = accounts.filter(a => a.status === AccountStatus.SOLD);
      const totalEarnings = await db.balanceLog.aggregate({
        where: {
          userId,
          type: 'EARNING',
        },
        _sum: { amount: true },
      });

      const recentActivity = await db.balanceLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      stats = {
        totalAccounts: accounts.length,
        availableAccounts: accounts.filter(a => a.status === AccountStatus.AVAILABLE).length,
        soldAccounts: soldAccounts.length,
        totalEarnings: totalEarnings._sum.amount || 0,
        totalValue: accounts.reduce((sum, a) => sum + a.basePrice, 0),
        recentActivity,
      };
    }

    if (role === Role.SUPER_ADMIN) {
      // Super Admin stats
      const [users, accounts, games, transactions] = await Promise.all([
        db.user.findMany({ select: { role: true } }),
        db.account.findMany({ where: { isDeleted: false }, select: { basePrice: true } }),
        db.game.findMany({ where: { status: true } }),
        db.transaction.findMany({ select: { finalPrice: true } }),
      ]);

      const recentActivity = await db.balanceLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      });

      stats = {
        totalUsers: users.length,
        totalSuppliers: users.filter(u => u.role === Role.SUPPLIER).length,
        totalResellers: users.filter(u => u.role === Role.RESELLER).length,
        totalAccounts: accounts.length,
        activeGames: games.length,
        totalTransactions: transactions.length,
        platformVolume: transactions.reduce((sum, t) => sum + t.finalPrice, 0),
        recentActivity,
      };
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
