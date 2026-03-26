// app/api/withdrawal-requests/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role, WithdrawalStatus } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (
      status &&
      Object.values(WithdrawalStatus).includes(status as WithdrawalStatus)
    ) {
      where.status = status;
    }
    if (type && ["WITHDRAW", "TRANSFER"].includes(type)) {
      where.type = type;
    }

    const [withdrawals, total] = await Promise.all([
      db.withdrawalRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          // PENTING: Pastikan tidak ada 'select' di level akar yang mengecualikan imageUrl.
          // Jika menggunakan include seperti ini, semua field (termasuk imageUrl) akan ikut terambil.
        },
      }),
      db.withdrawalRequest.count({ where }),
    ]);

    return NextResponse.json({
      withdrawals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal requests" },
      { status: 500 },
    );
  }
}
