import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - List all tracked accounts for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trackedAccounts = await db.trackedAccount.findMany({
      where: {
        userId: session.user.id,
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
            transaction: {
              select: {
                id: true,
                createdAt: true,
                reseller: {
                  select: { id: true, name: true },
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
    const result = trackedAccounts.map((ta) => ({
      id: ta.id,
      accountId: ta.account.id,
      publicId: ta.account.publicId,
      trackedAt: ta.createdAt,
      game: ta.account.game,
      server: ta.account.server,
      level: ta.account.level,
      diamond: ta.account.diamond,
      basePrice: ta.account.basePrice,
      status: ta.account.status,
      characters: ta.account.characters.map((c) => ({
        id: c.character.id,
        name: c.character.name,
        rarity: c.character.rarity,
      })),
      weapons: ta.account.weapons.map((w) => ({
        id: w.weapon.id,
        name: w.weapon.name,
        rarity: w.weapon.rarity,
      })),
      transaction: ta.account.transaction
        ? {
            id: ta.account.transaction.id,
            soldAt: ta.account.transaction.createdAt,
            buyer: ta.account.transaction.reseller.name,
          }
        : null,
    }));

    return NextResponse.json({ trackedAccounts: result });
  } catch (error) {
    console.error('Error fetching tracked accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add account to tracking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Check if account exists
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: { id: true, publicId: true },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if already tracking
    const existing = await db.trackedAccount.findUnique({
      where: {
        userId_accountId: {
          userId: session.user.id,
          accountId: accountId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already tracking this account' }, { status: 400 });
    }

    // Add to tracking
    const trackedAccount = await db.trackedAccount.create({
      data: {
        userId: session.user.id,
        accountId: accountId,
      },
    });

    return NextResponse.json({
      success: true,
      trackedAccount: {
        id: trackedAccount.id,
        accountId: account.id,
        publicId: account.publicId,
      },
    });
  } catch (error) {
    console.error('Error adding tracked account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
