import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decryptCredentials } from '@/lib/encryption';

// GET - List all extracted accounts for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeCredentials = searchParams.get('credentials') === 'true';
    const accountId = searchParams.get('accountId');

    // Build query
    const where: { resellerId: string; accountId?: string } = {
      resellerId: session.user.id,
    };

    if (accountId) {
      where.accountId = accountId;
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        account: {
          include: {
            game: {
              select: { id: true, name: true, code: true },
            },
            server: {
              select: { id: true, name: true },
            },
            characters: {
              include: {
                character: {
                  select: { id: true, name: true, rarity: true },
                },
              },
            },
            weapons: {
              include: {
                weapon: {
                  select: { id: true, name: true, rarity: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data for frontend
    const result = transactions.map((tx) => {
      let credentials = null;
      
      // Only include credentials if requested and user owns the transaction
      if (includeCredentials && tx.account.encryptedLogin) {
        try {
          credentials = decryptCredentials(tx.account.encryptedLogin);
        } catch (error) {
          console.error('Failed to decrypt credentials:', error);
          credentials = { error: 'Failed to decrypt credentials' };
        }
      }

      return {
        id: tx.id,
        createdAt: tx.createdAt,
        basePrice: tx.basePrice,
        platformFee: tx.platformFee,
        finalPrice: tx.finalPrice,
        account: {
          id: tx.account.id,
          publicId: tx.account.publicId,
          game: tx.account.game,
          server: tx.account.server,
          level: tx.account.level,
          diamond: tx.account.diamond,
          gender: tx.account.gender,
          characters: tx.account.characters.map((c) => ({
            id: c.character.id,
            name: c.character.name,
            rarity: c.character.rarity,
          })),
          weapons: tx.account.weapons.map((w) => ({
            id: w.weapon.id,
            name: w.weapon.name,
            rarity: w.weapon.rarity,
          })),
          status: tx.account.status,
        },
        credentials,
      };
    });

    return NextResponse.json({ transactions: result });
  } catch (error) {
    console.error('Error fetching extract history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
