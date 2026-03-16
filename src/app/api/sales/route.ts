import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';

// GET - Get sales history for supplier
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all transactions where the account belongs to this supplier
    const [sales, total] = await Promise.all([
      db.transaction.findMany({
        where: {
          account: {
            supplierId: token.id as string,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          account: {
            select: {
              publicId: true,
              game: { select: { name: true, code: true } },
            },
          },
          reseller: { select: { name: true, email: true } },
          pendingBalance: {
            select: { status: true, releaseDate: true },
          },
        },
      }),
      db.transaction.count({
        where: {
          account: {
            supplierId: token.id as string,
          },
        },
      }),
    ]);

    // Calculate summary
    const summary = await db.transaction.aggregate({
      where: {
        account: {
          supplierId: token.id as string,
        },
      },
      _sum: { basePrice: true },
    });

    // Get pending earnings summary
    const pendingSummary = await db.pendingBalanceRecord.aggregate({
      where: {
        userId: token.id as string,
        status: 'PENDING',
      },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      sales,
      summary: {
        totalSales: total,
        totalEarnings: summary._sum.basePrice || 0,
        pendingEarnings: pendingSummary._sum.amount || 0,
        pendingCount: pendingSummary._count,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sales history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales history' },
      { status: 500 }
    );
  }
}
