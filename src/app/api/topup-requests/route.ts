import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

import { getToken } from 'next-auth/jwt';
import { Role, TopupRequestStatus, ActivityAction } from '@prisma/client';
import { logActivityWithContext } from '@/lib/activity';



// GET - List topup requests
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    // Non-admin can only see their own requests
    if (token.role !== Role.SUPER_ADMIN) {
      where.userId = token.id;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const requests = await db.topupRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching topup requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topup requests' },
      { status: 500 }
    );
  }
}

// POST - Create topup request
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || (token.role !== Role.SUPPLIER && token.role !== Role.RESELLER)) {
      return NextResponse.json({ error: 'Unauthorized - Supplier/Reseller only' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethodId, proofUrl, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    // Verify payment method exists and is active
    const paymentMethod = await db.paymentMethod.findFirst({
      where: { id: paymentMethodId, status: true },
    });

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const topupRequest = await db.topupRequest.create({
      data: {
        userId: token.id as string,
        amount: parseFloat(amount),
        paymentMethodId,
        proofUrl,
        notes,
        status: TopupRequestStatus.PENDING,
      },
      include: {
        user: { select: { name: true, email: true } },
        paymentMethod: true,
      },
    });

    // Log activity
    await logActivityWithContext({
      action: ActivityAction.TOPUP_REQUEST,
      userId: token.id as string,
      entityType: 'TopupRequest',
      entityId: topupRequest.id,
      details: { 
        amount: parseFloat(amount),
        paymentMethod: paymentMethod.name,
      },
    }, request);

    return NextResponse.json({ request: topupRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating topup request:', error);
    return NextResponse.json(
      { error: 'Failed to create topup request' },
      { status: 500 }
    );
  }
}
