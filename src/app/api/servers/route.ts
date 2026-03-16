import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, ActivityAction } from '@prisma/client';
import { logActivityWithContext } from '@/lib/activity';

// GET - List all servers
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

    const servers = await db.server.findMany({
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

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}

// POST - Create new server (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, name, code, status } = body;

    if (!gameId || !name) {
      return NextResponse.json(
        { error: 'Game and server name are required' },
        { status: 400 }
      );
    }

    // Check if server already exists for this game
    const existing = await db.server.findUnique({
      where: {
        gameId_name: {
          gameId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Server with this name already exists for this game' },
        { status: 400 }
      );
    }

    const server = await db.server.create({
      data: {
        gameId,
        name,
        code: code || null,
        status: status !== undefined ? status : true,
      },
      include: {
        game: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.SERVER_CREATE,
      userId: token.id as string,
      entityType: 'Server',
      entityId: server.id,
      entityName: server.name,
      details: {
        gameName: server.game.name,
        code: server.code,
      },
    }, request);

    return NextResponse.json({ server }, { status: 201 });
  } catch (error) {
    console.error('Error creating server:', error);
    return NextResponse.json(
      { error: 'Failed to create server' },
      { status: 500 }
    );
  }
}

// PUT - Update server (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, code, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.server.findUnique({
      where: { id },
      include: { game: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    // Check name uniqueness if changing name
    if (name && name !== existing.name) {
      const duplicate = await db.server.findUnique({
        where: {
          gameId_name: {
            gameId: existing.gameId,
            name,
          },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Server with this name already exists for this game' },
          { status: 400 }
        );
      }
    }

    const server = await db.server.update({
      where: { id },
      data: {
        name: name || existing.name,
        code: code !== undefined ? code : existing.code,
        status: status !== undefined ? status : existing.status,
      },
      include: {
        game: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.SERVER_UPDATE,
      userId: token.id as string,
      entityType: 'Server',
      entityId: server.id,
      entityName: server.name,
      details: {
        gameName: server.game.name,
        changes: { name, code, status },
      },
    }, request);

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Error updating server:', error);
    return NextResponse.json(
      { error: 'Failed to update server' },
      { status: 500 }
    );
  }
}
