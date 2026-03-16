import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role, PendingBalanceStatus } from '@prisma/client';
import { db } from '@/lib/db';

// GET - Get pending balances (Super Admin) or user's own pending balances
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    // If not Super Admin, only show own pending balances
    if (token.role !== Role.SUPER_ADMIN) {
      where.userId = token.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status && Object.values(PendingBalanceStatus).includes(status as PendingBalanceStatus)) {
      where.status = status;
    }

    const [pendingBalances, total] = await Promise.all([
      db.pendingBalanceRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          transaction: {
            include: {
              account: {
                select: { publicId: true, game: { select: { name: true } } },
              },
            },
          },
        },
      }),
      db.pendingBalanceRecord.count({ where }),
    ]);

    // Calculate summary for the user
    const summary = await db.pendingBalanceRecord.aggregate({
      where: {
        ...where,
        status: PendingBalanceStatus.PENDING,
      },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      pendingBalances,
      summary: {
        totalPending: summary._sum.amount || 0,
        count: summary._count,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching pending balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending balances' },
      { status: 500 }
    );
  }
}
