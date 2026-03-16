import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE - Remove account from tracking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if tracked account exists and belongs to user
    const trackedAccount = await db.trackedAccount.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!trackedAccount) {
      return NextResponse.json({ error: 'Tracked account not found' }, { status: 404 });
    }

    // Delete the tracked account
    await db.trackedAccount.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tracked account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check if account is tracked by current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if the account is tracked (id can be trackedAccount.id or account.publicId)
    const trackedAccount = await db.trackedAccount.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          { id: id },
          { account: { publicId: id } },
        ],
      },
      include: {
        account: {
          select: {
            id: true,
            publicId: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      isTracked: !!trackedAccount,
      trackedAccount: trackedAccount
        ? {
            id: trackedAccount.id,
            accountId: trackedAccount.account.id,
            publicId: trackedAccount.account.publicId,
            status: trackedAccount.account.status,
          }
        : null,
    });
  } catch (error) {
    console.error('Error checking tracked account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
