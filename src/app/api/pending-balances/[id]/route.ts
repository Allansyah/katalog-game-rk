import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role, PendingBalanceStatus } from "@prisma/client";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(PendingBalanceStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Only allow RELEASED
    if (status !== PendingBalanceStatus.RELEASED) {
      return NextResponse.json(
        { error: "Only RELEASED status update is allowed" },
        { status: 400 }
      );
    }

    // Get the pending balance
    const pendingBalance = await db.pendingBalanceRecord.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!pendingBalance) {
      return NextResponse.json(
        { error: "Pending balance not found" },
        { status: 404 }
      );
    }

    if (pendingBalance.status !== PendingBalanceStatus.PENDING) {
      return NextResponse.json(
        { error: "Balance is not pending" },
        { status: 400 }
      );
    }

    // Use transaction to update
    const result = await db.$transaction(async (tx) => {
      // Update pending balance
      const updated = await tx.pendingBalanceRecord.update({
        where: { id },
        data: {
          status: PendingBalanceStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      // Update user balances
      await tx.user.update({
        where: { id: pendingBalance.userId },
        data: {
          salesBalance: { increment: pendingBalance.amount },
          pendingBalance: { decrement: pendingBalance.amount },
        },
      });

      // Create balance log
      await tx.balanceLog.create({
        data: {
          userId: pendingBalance.userId,
          amount: pendingBalance.amount,
          type: "SALES_RELEASED",
          description: `Sales released for transaction ${pendingBalance.transactionId}`,
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating pending balance:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update pending balance",
      },
      { status: 500 }
    );
  }
}
