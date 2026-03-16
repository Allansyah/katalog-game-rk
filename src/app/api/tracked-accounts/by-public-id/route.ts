import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Add account to tracking by public ID
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    // Check if account exists
    const account = await db.account.findUnique({
      where: { publicId: publicId },
      select: { 
        id: true, 
        publicId: true,
        status: true,
        game: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if already tracking
    const existing = await db.trackedAccount.findUnique({
      where: {
        userId_accountId: {
          userId: session.user.id,
          accountId: account.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'Already tracking this account',
        existing: true,
        trackedAccount: {
          id: existing.id,
          publicId: account.publicId,
        }
      }, { status: 400 });
    }

    // Add to tracking
    const trackedAccount = await db.trackedAccount.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
      },
    });

    return NextResponse.json({
      success: true,
      trackedAccount: {
        id: trackedAccount.id,
        accountId: account.id,
        publicId: account.publicId,
        status: account.status,
        game: account.game,
      },
    });
  } catch (error) {
    console.error('Error adding tracked account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
