import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';
import { ActivityLogger } from '@/lib/activity';

// POST - Ban or Unban user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isBanned, reason } = body;

    // Prevent banning yourself
    if (id === token.id) {
      return NextResponse.json({ error: 'Cannot ban yourself' }, { status: 400 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent banning super admin
    if (user.role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Cannot ban super admin' }, { status: 400 });
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: { 
        isBanned,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    // Log activity
    if (isBanned) {
      await ActivityLogger.userBan(
        token.id as string,
        { id: user.id, name: user.name },
        reason,
        request
      );
    } else {
      await ActivityLogger.userUnban(
        token.id as string,
        { id: user.id, name: user.name },
        request
      );
    }

    return NextResponse.json({ 
      user: updatedUser,
      message: isBanned ? 'User banned successfully' : 'User unbanned successfully'
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
