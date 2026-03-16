import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, ActivityAction } from '@prisma/client';
import { logActivityWithContext } from '@/lib/activity';

// GET - List all games with related data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const includeRelations = searchParams.get('includeRelations') === 'true';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search.toUpperCase() } },
      ];
    }

    // If includeRelations is true, fetch characters, weapons, and servers
    if (includeRelations) {
      const games = await db.game.findMany({
        where,
        include: {
          characters: {
            select: { id: true, name: true, rarity: true, element: true, imageUrl: true },
            orderBy: { name: 'asc' }
          },
          weapons: {
            select: { id: true, name: true, rarity: true, weaponType: true, imageUrl: true },
            orderBy: { name: 'asc' }
          },
          servers: {
            select: { id: true, name: true, code: true, status: true },
            where: { status: true },
            orderBy: { name: 'asc' }
          },
          _count: {
            select: {
              characters: true,
              weapons: true,
              servers: true,
              accounts: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ games });
    }

    // Default: basic game info with counts
    const games = await db.game.findMany({
      where,
      include: {
        _count: {
          select: {
            characters: true,
            weapons: true,
            servers: true,
            accounts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

// POST - Create new game (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, icon, status } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Game name and code are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await db.game.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'Game code already exists' },
        { status: 400 }
      );
    }

    const game = await db.game.create({
      data: {
        name,
        code: code.toUpperCase(),
        icon: icon || null,
        status: status !== undefined ? status : true,
      },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.GAME_CREATE,
      userId: token.id as string,
      entityType: 'Game',
      entityId: game.id,
      entityName: game.name,
      details: {
        code: game.code,
      },
    }, request);

    return NextResponse.json({ game }, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}

// PUT - Update game (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, code, icon, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.game.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check code uniqueness if changing
    if (code && code.toUpperCase() !== existing.code) {
      const duplicate = await db.game.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Game code already exists' },
          { status: 400 }
        );
      }
    }

    const game = await db.game.update({
      where: { id },
      data: {
        name: name || existing.name,
        code: code ? code.toUpperCase() : existing.code,
        icon: icon !== undefined ? icon : existing.icon,
        status: status !== undefined ? status : existing.status,
      },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.GAME_UPDATE,
      userId: token.id as string,
      entityType: 'Game',
      entityId: game.id,
      entityName: game.name,
      details: {
        changes: { name, code, status },
      },
    }, request);

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    );
  }
}
