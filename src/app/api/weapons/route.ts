import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, ActivityAction } from '@prisma/client';
import { logActivityWithContext } from '@/lib/activity';

// GET - List all weapons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const gameId = searchParams.get('gameId');

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search };
    }

    if (gameId && gameId !== 'all') {
      where.gameId = gameId;
    }

    const weapons = await db.weapon.findMany({
      where,
      include: {
        game: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { accounts: true },
        },
      },
      orderBy: [{ game: { name: 'asc' } }, { name: 'asc' }],
    });

    return NextResponse.json({ weapons });
  } catch (error) {
    console.error('Error fetching weapons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weapons' },
      { status: 500 }
    );
  }
}

// POST - Create new weapon (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, name, imageUrl, rarity, weaponType, element } = body;

    if (!gameId || !name) {
      return NextResponse.json(
        { error: 'Game and weapon name are required' },
        { status: 400 }
      );
    }

    // Check if weapon already exists for this game
    const existing = await db.weapon.findUnique({
      where: {
        gameId_name: {
          gameId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Weapon with this name already exists for this game' },
        { status: 400 }
      );
    }

    const weapon = await db.weapon.create({
      data: {
        gameId,
        name,
        imageUrl: imageUrl || null,
        rarity: rarity ? parseInt(rarity) : null,
        weaponType: weaponType || null,
        element: element || null,
      },
      include: {
        game: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.WEAPON_CREATE,
      userId: token.id as string,
      entityType: 'Weapon',
      entityId: weapon.id,
      entityName: weapon.name,
      details: {
        gameName: weapon.game.name,
        rarity: weapon.rarity,
        weaponType: weapon.weaponType,
      },
    }, request);

    return NextResponse.json({ weapon }, { status: 201 });
  } catch (error) {
    console.error('Error creating weapon:', error);
    return NextResponse.json(
      { error: 'Failed to create weapon' },
      { status: 500 }
    );
  }
}

// PUT - Update weapon (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, imageUrl, rarity, weaponType, element } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Weapon ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.weapon.findUnique({
      where: { id },
      include: { game: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Weapon not found' },
        { status: 404 }
      );
    }

    // Check name uniqueness if changing name
    if (name && name !== existing.name) {
      const duplicate = await db.weapon.findUnique({
        where: {
          gameId_name: {
            gameId: existing.gameId,
            name,
          },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Weapon with this name already exists for this game' },
          { status: 400 }
        );
      }
    }

    const weapon = await db.weapon.update({
      where: { id },
      data: {
        name: name || existing.name,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        rarity: rarity !== undefined ? (rarity ? parseInt(rarity) : null) : existing.rarity,
        weaponType: weaponType !== undefined ? weaponType : existing.weaponType,
        element: element !== undefined ? element : existing.element,
      },
      include: {
        game: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.WEAPON_UPDATE,
      userId: token.id as string,
      entityType: 'Weapon',
      entityId: weapon.id,
      entityName: weapon.name,
      details: {
        gameName: weapon.game.name,
        changes: { name, rarity, weaponType, element },
      },
    }, request);

    return NextResponse.json({ weapon });
  } catch (error) {
    console.error('Error updating weapon:', error);
    return NextResponse.json(
      { error: 'Failed to update weapon' },
      { status: 500 }
    );
  }
}
