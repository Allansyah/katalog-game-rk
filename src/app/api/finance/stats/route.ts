import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, LogType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total volume from transactions
    const transactions = await db.transaction.findMany({
      select: { finalPrice: true },
    });
    const totalVolume = transactions.reduce((sum, t) => sum + t.finalPrice, 0);

    // Get total top-ups
    const topups = await db.balanceLog.findMany({
      where: { type: LogType.TOPUP },
      select: { amount: true },
    });
    const totalTopups = topups.reduce((sum, t) => sum + t.amount, 0);

    // Get active users (users with balance > 0 or recent transactions)
    const activeUsers = await db.user.count({
      where: {
        OR: [
          { balance: { gt: 0 } },
          {
            balanceLogs: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
              },
            },
          },
        ],
      },
    });

    // Get total sales
    const totalSales = await db.transaction.count();

    // Get recent activity
    const recentActivity = await db.balanceLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({
      totalVolume,
      totalTopups,
      activeUsers,
      totalSales,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching finance stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
