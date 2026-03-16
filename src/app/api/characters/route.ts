import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
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

    const characters = await db.character.findMany({
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

    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}
