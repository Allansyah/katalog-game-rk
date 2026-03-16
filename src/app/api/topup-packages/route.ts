import { db, Role } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

import { getToken } from 'next-auth/jwt';




export async function GET() {
  try {
    const packages = await db.topupPackage.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' },
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Error fetching topup packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topup packages' },
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
    const { amount, bonus, description, isActive } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const pkg = await db.topupPackage.create({
      data: {
        amount: parseFloat(amount),
        bonus: parseFloat(bonus || 0),
        description,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    console.error('Error creating topup package:', error);
    return NextResponse.json(
      { error: 'Failed to create topup package' },
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
    const { id, amount, bonus, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const pkg = await db.topupPackage.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        bonus: bonus !== undefined ? parseFloat(bonus) : undefined,
        description,
        isActive,
      },
    });

    return NextResponse.json({ package: pkg });
  } catch (error) {
    console.error('Error updating topup package:', error);
    return NextResponse.json(
      { error: 'Failed to update topup package' },
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
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.topupPackage.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting topup package:', error);
    return NextResponse.json(
      { error: 'Failed to delete topup package' },
      { status: 500 }
    );
  }
}
