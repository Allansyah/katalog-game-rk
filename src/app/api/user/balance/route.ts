import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';

// GET - Get current user's real-time balance
export async function GET(request: Request) {
  try {
    const token = await getToken({ req: request as any });
    
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        salesBalance: true,
        pendingBalance: true,
        tierId: true,
        tier: {
          select: {
            id: true,
            name: true,
            discountPercent: true,
          },
        },
        totalSpent: true,
        isBanned: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
