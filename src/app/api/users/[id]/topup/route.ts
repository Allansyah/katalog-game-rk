import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, LogType } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update balance and create log
    const result = await db.$transaction([
      db.user.update({
        where: { id },
        data: { balance: { increment: amount } },
      }),
      db.balanceLog.create({
        data: {
          userId: id,
          amount,
          type: LogType.TOPUP,
          description: description || 'Admin top-up',
        },
      }),
    ]);

    return NextResponse.json({
      user: {
        id: result[0].id,
        name: result[0].name,
        email: result[0].email,
        balance: result[0].balance,
      },
      log: result[1],
    });
  } catch (error) {
    console.error('Top-up error:', error);
    return NextResponse.json(
      { error: 'Failed to top-up balance' },
      { status: 500 }
    );
  }
}
