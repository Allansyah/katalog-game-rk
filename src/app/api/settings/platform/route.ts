import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { getPlatformSettings } from '@/lib/platform';
import { ActivityLogger } from '@/lib/activity';

// GET - Get platform settings
export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform settings' },
      { status: 500 }
    );
  }
}

// PUT - Update platform settings (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { platformFee } = body;

    if (typeof platformFee !== 'number' || platformFee < 0 || platformFee > 100) {
      return NextResponse.json(
        { error: 'Platform fee must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    // Get current settings
    let settings = await db.platformSettings.findFirst();
    const oldFee = settings?.platformFee;

    if (settings) {
      settings = await db.platformSettings.update({
        where: { id: settings.id },
        data: { platformFee },
      });
    } else {
      settings = await db.platformSettings.create({
        data: { platformFee },
      });
    }

    // Log activity if fee changed
    if (oldFee !== platformFee) {
      await ActivityLogger.platformSettingsUpdate(
        token.id as string,
        { platformFee: { from: oldFee, to: platformFee } },
        request
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return NextResponse.json(
      { error: 'Failed to update platform settings' },
      { status: 500 }
    );
  }
}
