import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role, ActivityAction } from '@prisma/client';
import { logActivityWithContext } from '@/lib/activity';

// DELETE - Delete server (Super Admin only)
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

    // Get server details before deletion
    const server = await db.server.findUnique({
      where: { id },
      include: {
        game: { select: { name: true } },
        _count: { select: { accounts: true } },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    // Check if server is used in accounts
    if (server._count.accounts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete server used in accounts' },
        { status: 400 }
      );
    }

    await db.server.delete({
      where: { id },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.SERVER_DELETE,
      userId: token.id as string,
      entityType: 'Server',
      entityId: id,
      entityName: server.name,
      details: {
        gameName: server.game.name,
      },
    }, request);

    return NextResponse.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Error deleting server:', error);
    return NextResponse.json(
      { error: 'Failed to delete server' },
      { status: 500 }
    );
  }
}
