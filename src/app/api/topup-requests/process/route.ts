import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  Role,
  TopupRequestStatus,
  LogType,
  ActivityAction,
} from "@prisma/client";
import { logActivityWithContext } from "@/lib/activity";

// POST - Approve or Reject topup request (Admin Only)
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { id, action, adminNotes } = body;

    if (!id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Valid id and action are required" },
        { status: 400 },
      );
    }

    const topupRequest = await db.topupRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!topupRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (topupRequest.status !== TopupRequestStatus.PENDING) {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      const result = await db.$transaction([
        db.topupRequest.update({
          where: { id },
          data: {
            status: TopupRequestStatus.APPROVED,
            adminNotes,
            processedAt: new Date(),
            processedBy: token.id as string,
          },
        }),
        db.user.update({
          where: { id: topupRequest.userId },
          data: { balance: { increment: topupRequest.amount } },
        }),
        db.balanceLog.create({
          data: {
            userId: topupRequest.userId,
            amount: topupRequest.amount,
            type: LogType.TOPUP,
            description: "Top-up approved by admin",
          },
        }),
      ]);

      await logActivityWithContext(
        {
          action: ActivityAction.TOPUP_APPROVE,
          userId: token.id as string,
          entityType: "TopupRequest",
          entityId: id,
          details: {
            amount: topupRequest.amount,
            targetUserId: topupRequest.userId,
          },
        },
        request,
      );

      return NextResponse.json({ request: result[0] });
    } else {
      // Reject
      const result = await db.topupRequest.update({
        where: { id },
        data: {
          status: TopupRequestStatus.REJECTED,
          adminNotes,
          processedAt: new Date(),
          processedBy: token.id as string,
        },
      });

      await logActivityWithContext(
        {
          action: ActivityAction.TOPUP_REJECT,
          userId: token.id as string,
          entityType: "TopupRequest",
          entityId: id,
          details: {
            amount: topupRequest.amount,
            targetUserId: topupRequest.userId,
            reason: adminNotes,
          },
        },
        request,
      );

      return NextResponse.json({ request: result });
    }
  } catch (error) {
    console.error("Error processing topup request:", error);
    return NextResponse.json(
      { error: "Failed to process topup request" },
      { status: 500 },
    );
  }
}
