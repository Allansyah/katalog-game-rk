import { NextRequest, NextResponse } from 'next/server';
import { db, Role } from '@/lib/db';
import { getToken } from 'next-auth/jwt';

// GET - List all tiers
export async function GET() {
  try {
    const tiers = await db.resellerTier.findMany({
      orderBy: { minTotalSales: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tiers' },
      { status: 500 }
    );
  }
}

// POST - Create new tier
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, discountPercent, minTotalSales, color, isDefault } = body;

    if (!name || discountPercent === undefined || minTotalSales === undefined) {
      return NextResponse.json({ error: 'Name, discount percent, and min total sales are required' }, { status: 400 });
    }

    // If this is set as default, remove default from other tiers
    if (isDefault) {
      await db.resellerTier.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const tier = await db.resellerTier.create({
      data: {
        name,
        discountPercent: parseFloat(discountPercent),
        minTotalSales: parseFloat(minTotalSales),
        color: color || null,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error) {
    console.error('Error creating tier:', error);
    return NextResponse.json(
      { error: 'Failed to create tier' },
      { status: 500 }
    );
  }
}

// PUT - Update tier
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, discountPercent, minTotalSales, color, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // If this is set as default, remove default from other tiers
    if (isDefault) {
      await db.resellerTier.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const tier = await db.resellerTier.update({
      where: { id },
      data: {
        name,
        discountPercent: discountPercent !== undefined ? parseFloat(discountPercent) : undefined,
        minTotalSales: minTotalSales !== undefined ? parseFloat(minTotalSales) : undefined,
        color,
        isDefault,
      },
    });

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Error updating tier:', error);
    return NextResponse.json(
      { error: 'Failed to update tier' },
      { status: 500 }
    );
  }
}

// DELETE - Delete tier
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

    // Check if tier has users
    const tier = await db.resellerTier.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    if (tier._count.users > 0) {
      return NextResponse.json({ 
        error: `Cannot delete tier with ${tier._count.users} users. Reassign users first.` 
      }, { status: 400 });
    }

    await db.resellerTier.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tier deleted successfully' });
  } catch (error) {
    console.error('Error deleting tier:', error);
    return NextResponse.json(
      { error: 'Failed to delete tier' },
      { status: 500 }
    );
  }
}
