import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role, WithdrawalStatus, LogType, ActivityAction } from '@prisma/client';
import { db } from '@/lib/db';
import { logActivityWithContext } from '@/lib/activity';

// GET - Get user's withdrawal requests
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = { userId: token.id };
    if (status && Object.values(WithdrawalStatus).includes(status as WithdrawalStatus)) {
      where.status = status;
    }

    const withdrawals = await db.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

// POST - Create withdrawal request
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, source, bankName, bankAccount, accountName, notes } = body;

    // Validate
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!type || !['WITHDRAW', 'TRANSFER'].includes(type)) {
      return NextResponse.json({ error: 'Invalid withdrawal type' }, { status: 400 });
    }

    if (!source || !['balance', 'salesBalance'].includes(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    // For withdraw to bank, require bank details
    if (type === 'WITHDRAW') {
      if (!bankName || !bankAccount || !accountName) {
        return NextResponse.json(
          { error: 'Bank details required for withdrawal' },
          { status: 400 }
        );
      }
    }

    // For transfer, only allow from salesBalance to balance
    if (type === 'TRANSFER' && source !== 'salesBalance') {
      return NextResponse.json(
        { error: 'Transfer only allowed from sales balance' },
        { status: 400 }
      );
    }

    // Check user balance
    const user = await db.user.findUnique({
      where: { id: token.id as string },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const availableBalance = source === 'balance' ? user.balance : user.salesBalance;
    if (availableBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient ${source === 'balance' ? 'balance' : 'sales balance'}` },
        { status: 400 }
      );
    }

    // For transfer, process immediately
    if (type === 'TRANSFER') {
      const result = await db.$transaction(async (tx) => {
        // Deduct from sales balance
        await tx.user.update({
          where: { id: user.id },
          data: {
            salesBalance: { decrement: amount },
            balance: { increment: amount },
          },
        });

        // Create withdrawal record (auto-approved for transfers)
        const withdrawal = await tx.withdrawalRequest.create({
          data: {
            userId: user.id,
            amount,
            type: 'TRANSFER',
            source,
            status: 'APPROVED',
            notes,
            processedAt: new Date(),
            processedBy: user.id, // Self-processed
          },
        });

        // Create balance log
        await tx.balanceLog.create({
          data: {
            userId: user.id,
            amount: -amount,
            type: LogType.TRANSFER,
            description: `Transfer to purchase balance`,
          },
        });

        return withdrawal;
      });

      // Log activity
      await logActivityWithContext({
        action: ActivityAction.TRANSFER_BALANCE,
        userId: user.id,
        details: {
          amount,
          from: source,
          to: 'balance',
        },
      }, request);

      return NextResponse.json({ withdrawal: result, message: 'Transfer successful' });
    }

    // For withdraw, create pending request
    const withdrawal = await db.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount,
        type: 'WITHDRAW',
        source,
        bankName,
        bankAccount,
        accountName,
        status: 'PENDING',
        notes,
      },
    });

    // Deduct balance immediately (pending approval)
    await db.$transaction(async (tx) => {
      const updateField = source === 'balance' ? 'balance' : 'salesBalance';
      await tx.user.update({
        where: { id: user.id },
        data: {
          [updateField]: { decrement: amount },
        },
      });

      await tx.balanceLog.create({
        data: {
          userId: user.id,
          amount: -amount,
          type: LogType.WITHDRAWAL,
          description: `Withdrawal request to ${bankName} - ${bankAccount}`,
        },
      });
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.WITHDRAW_REQUEST,
      userId: user.id,
      entityType: 'WithdrawalRequest',
      entityId: withdrawal.id,
      details: {
        amount,
        type: 'WITHDRAW',
        source,
        bankName,
        bankAccount,
      },
    }, request);

    return NextResponse.json({
      withdrawal,
      message: 'Withdrawal request submitted, waiting for admin approval',
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to create withdrawal request' },
      { status: 500 }
    );
  }
}
