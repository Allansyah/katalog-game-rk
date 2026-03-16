import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';

// GET - Get platform earnings (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [earnings, total, summary] = await Promise.all([
      db.platformEarning.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transaction: {
            include: {
              account: {
                select: { publicId: true, game: { select: { name: true } } },
              },
              reseller: { select: { name: true, email: true } },
            },
          },
        },
      }),
      db.platformEarning.count({ where }),
      db.platformEarning.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      earnings,
      summary: {
        totalEarnings: summary._sum.amount || 0,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching platform earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform earnings' },
      { status: 500 }
    );
  }
}
