import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';
import { hash } from 'bcrypt';
import { ActivityLogger, getRequestInfo } from '@/lib/activity';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const roleFilter = searchParams.get('role');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (roleFilter && roleFilter !== 'all') {
      where.role = roleFilter;
    }

    const users = await db.user.findMany({
      where,
      include: {
        tier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role, tierId, balance } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: role as Role,
        tierId: tierId || null,
        balance: parseFloat(balance) || 0,
      },
      include: {
        tier: true,
      },
    });

    // Log activity
    await ActivityLogger.userCreate(
      token.id as string,
      { id: user.id, name: user.name, email: user.email, role: user.role },
      request
    );

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, email, password, role, tierId, balance } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const changes: Record<string, unknown> = {};
    
    if (name && name !== existingUser.name) {
      updateData.name = name;
      changes.name = { from: existingUser.name, to: name };
    }
    if (email && email !== existingUser.email) {
      updateData.email = email;
      changes.email = { from: existingUser.email, to: email };
    }
    if (role && role !== existingUser.role) {
      updateData.role = role;
      changes.role = { from: existingUser.role, to: role };
    }
    if (tierId !== undefined && tierId !== existingUser.tierId) {
      updateData.tierId = tierId || null;
      changes.tierId = { from: existingUser.tierId, to: tierId };
    }
    if (balance !== undefined && parseFloat(balance) !== existingUser.balance) {
      updateData.balance = parseFloat(balance);
      changes.balance = { from: existingUser.balance, to: parseFloat(balance) };
    }
    if (password) {
      updateData.passwordHash = await hash(password, 12);
      changes.passwordChanged = true;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: { tier: true },
    });

    // Log activity if there were changes
    if (Object.keys(changes).length > 0) {
      await ActivityLogger.userUpdate(
        token.id as string,
        { id: user.id, name: user.name },
        changes,
        request
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent deleting yourself
    if (id === token.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user
    await db.user.delete({
      where: { id },
    });

    // Log activity
    await ActivityLogger.userDelete(
      token.id as string,
      { id: user.id, name: user.name, email: user.email },
      request
    );

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
