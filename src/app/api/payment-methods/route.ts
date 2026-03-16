import { db, Role } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

import { getToken } from 'next-auth/jwt';




export async function GET() {
  try {
    const methods = await db.paymentMethod.findMany({
      where: { status: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ methods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
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
    const { name, type, accountNo, accountName, imageUrl, instructions, status } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const method = await db.paymentMethod.create({
      data: {
        name,
        type,
        accountNo,
        accountName,
        imageUrl,
        instructions,
        status: status ?? true,
      },
    });

    return NextResponse.json({ method }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to create payment method' },
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
    const { id, name, type, accountNo, accountName, imageUrl, instructions, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const method = await db.paymentMethod.update({
      where: { id },
      data: { name, type, accountNo, accountName, imageUrl, instructions, status },
    });

    return NextResponse.json({ method });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}
