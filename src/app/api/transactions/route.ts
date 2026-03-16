import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, LogType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string;
    const userRole = token.role as Role;

    let transactions;
    let stats;

    if (userRole === Role.SUPER_ADMIN) {
      // Get all transactions for super admin
      transactions = await db.balanceLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: { select: { name: true } },
        },
      });

      // Calculate stats
      const allLogs = await db.balanceLog.findMany();
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const thisMonthLogs = allLogs.filter(l => new Date(l.createdAt) >= thisMonth);

      stats = {
        total: allLogs.length,
        volume: allLogs.reduce((sum, l) => sum + Math.abs(l.amount), 0),
        thisMonth: thisMonthLogs.length,
      };
    } else {
      // Get user's own transactions
      transactions = await db.balanceLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      // Calculate stats
      const allLogs = await db.balanceLog.findMany({ where: { userId } });
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const thisMonthLogs = allLogs.filter(l => new Date(l.createdAt) >= thisMonth);

      stats = {
        total: allLogs.length,
        volume: allLogs.reduce((sum, l) => sum + Math.abs(l.amount), 0),
        thisMonth: thisMonthLogs.length,
      };
    }

    return NextResponse.json({ transactions, stats });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
