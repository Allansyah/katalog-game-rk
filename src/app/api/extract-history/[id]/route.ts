import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decryptCredentials } from '@/lib/encryption';

// GET - Get credentials for a specific extracted account
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

    // Find the transaction - must belong to the current user
    const transaction = await db.transaction.findFirst({
      where: {
        id: id,
        resellerId: session.user.id,
      },
      include: {
        account: {
          include: {
            game: {
              select: { id: true, name: true, code: true },
            },
            server: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Decrypt credentials
    let credentials = null;
    if (transaction.account.encryptedLogin) {
      try {
        credentials = decryptCredentials(transaction.account.encryptedLogin);
      } catch (error) {
        console.error('Failed to decrypt credentials:', error);
        return NextResponse.json({ error: 'Failed to decrypt credentials' }, { status: 500 });
      }
    }

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        createdAt: transaction.createdAt,
        basePrice: transaction.basePrice,
        platformFee: transaction.platformFee,
        finalPrice: transaction.finalPrice,
        account: {
          id: transaction.account.id,
          publicId: transaction.account.publicId,
          game: transaction.account.game,
          server: transaction.account.server,
          level: transaction.account.level,
          diamond: transaction.account.diamond,
          status: transaction.account.status,
        },
        credentials,
      },
    });
  } catch (error) {
    console.error('Error fetching transaction credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
