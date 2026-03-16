import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, ActivityAction } from '@prisma/client';
import { logActivityWithContext } from '@/lib/activity';

// DELETE - Delete weapon (Super Admin only)
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

    // Get weapon details before deletion
    const weapon = await db.weapon.findUnique({
      where: { id },
      include: {
        game: { select: { name: true } },
        _count: { select: { accounts: true } },
      },
    });

    if (!weapon) {
      return NextResponse.json(
        { error: 'Weapon not found' },
        { status: 404 }
      );
    }

    // Check if weapon is used in accounts
    if (weapon._count.accounts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete weapon used in accounts' },
        { status: 400 }
      );
    }

    await db.weapon.delete({
      where: { id },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.WEAPON_DELETE,
      userId: token.id as string,
      entityType: 'Weapon',
      entityId: id,
      entityName: weapon.name,
      details: {
        gameName: weapon.game.name,
      },
    }, request);

    return NextResponse.json({ message: 'Weapon deleted successfully' });
  } catch (error) {
    console.error('Error deleting weapon:', error);
    return NextResponse.json(
      { error: 'Failed to delete weapon' },
      { status: 500 }
    );
  }
}
