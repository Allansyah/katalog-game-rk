import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, ActivityAction } from '@prisma/client';
import { logActivityWithContext } from '@/lib/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const game = await db.game.findUnique({
      where: { id },
      include: {
        characters: {
          select: { id: true, name: true, rarity: true, element: true, imageUrl: true },
          orderBy: { name: 'asc' },
        },
        weapons: {
          select: { id: true, name: true, rarity: true, weaponType: true, imageUrl: true },
          orderBy: { name: 'asc' },
        },
        servers: {
          select: { id: true, name: true, code: true, status: true },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { accounts: true, characters: true, weapons: true, servers: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const { id } = await params;

    // Check if game has accounts
    const accountsCount = await db.account.count({
      where: { gameId: id },
    });

    if (accountsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete game with existing accounts. Disable it instead.' },
        { status: 400 }
      );
    }

    // Get game info for logging
    const game = await db.game.findUnique({
      where: { id },
      select: { name: true, code: true }
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Delete characters first (cascade should handle this, but let's be explicit)
    await db.character.deleteMany({
      where: { gameId: id },
    });

    // Delete weapons
    await db.weapon.deleteMany({
      where: { gameId: id },
    });

    // Delete servers
    await db.server.deleteMany({
      where: { gameId: id },
    });

    // Delete game
    await db.game.delete({
      where: { id },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.GAME_DELETE,
      userId: token.id as string,
      entityType: 'Game',
      entityId: id,
      entityName: game.name,
      details: {
        code: game.code,
      },
    }, request);

    return NextResponse.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}
