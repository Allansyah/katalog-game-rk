import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { TopupRequestStatus } from "@prisma/client";

// DELETE - Cancel topup request (by User)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }, // Jika Next.js 15, tipe ini seharusnya Promise
) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // === PERBAIKAN DI SINI ===
    // Tambahkan 'await' di depan params.
    // Ini penting untuk Next.js versi baru di mana params adalah Promise.
    const { id } = await params;

    // Validasi ID sederhana
    if (!id) {
      return NextResponse.json(
        { error: "Request ID is missing" },
        { status: 400 },
      );
    }

    // 1. Cari request yang akan dibatalkan
    const topupRequest = await db.topupRequest.findUnique({
      where: { id },
    });

    if (!topupRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 2. Otorisasi
    if (topupRequest.userId !== token.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only cancel your own request" },
        { status: 403 },
      );
    }

    // 3. Validasi Status
    if (topupRequest.status !== TopupRequestStatus.PENDING) {
      return NextResponse.json(
        { error: "Only pending requests can be cancelled" },
        { status: 400 },
      );
    }

    // 4. Update status
    const result = await db.topupRequest.update({
      where: { id },
      data: {
        status: TopupRequestStatus.REJECTED,
        adminNotes: "Cancelled by user",
      },
    });

    return NextResponse.json({ request: result });
  } catch (error) {
    console.error("Error cancelling topup request:", error);
    return NextResponse.json(
      { error: "Failed to cancel request" },
      { status: 500 },
    );
  }
}
