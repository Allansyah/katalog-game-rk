import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role, PendingBalanceStatus } from "@prisma/client";
import { db } from "@/lib/db";

// GET - Get pending balances dengan filter
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to"); // YYYY-MM-DD
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    // Jika bukan Super Admin, hanya lihat milik sendiri
    if (token.role !== Role.SUPER_ADMIN) {
      where.userId = token.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (
      status &&
      Object.values(PendingBalanceStatus).includes(
        status as PendingBalanceStatus
      )
    ) {
      where.status = status;
    }

    // Filter berdasarkan rentang tanggal release
    if (from || to) {
      where.releaseDate = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        where.releaseDate.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.releaseDate.lte = toDate;
      }
    }

    // Pencarian berdasarkan nama supplier atau public ID account
    if (search) {
      where.OR = [
        {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          user: {
            email: { contains: search, mode: "insensitive" },
          },
        },
        {
          transaction: {
            account: {
              publicId: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [pendingBalances, total] = await Promise.all([
      db.pendingBalanceRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          transaction: {
            include: {
              account: {
                select: {
                  publicId: true,
                  game: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      db.pendingBalanceRecord.count({ where }),
    ]);

    // Hitung summary untuk status PENDING saja (dengan filter yang sama)
    const summaryWhere = { ...where, status: PendingBalanceStatus.PENDING };
    const summary = await db.pendingBalanceRecord.aggregate({
      where: summaryWhere,
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      pendingBalances,
      summary: {
        totalPending: summary._sum.amount || 0,
        count: summary._count,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pending balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending balances" },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update pending balances (khusus Super Admin)
export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid or missing ids" },
        { status: 400 }
      );
    }

    if (!status || !Object.values(PendingBalanceStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Hanya mengizinkan perubahan ke RELEASED
    if (status !== PendingBalanceStatus.RELEASED) {
      return NextResponse.json(
        { error: "Only RELEASED status update is allowed" },
        { status: 400 }
      );
    }

    // Gunakan transaction untuk konsistensi data
    const result = await db.$transaction(async (tx) => {
      // Ambil pending balances yang akan di-update
      const pendingBalances = await tx.pendingBalanceRecord.findMany({
        where: {
          id: { in: ids },
          status: PendingBalanceStatus.PENDING,
        },
        include: {
          user: true,
        },
      });

      if (pendingBalances.length === 0) {
        throw new Error("No valid pending balances found");
      }

      // Update status masing-masing
      const updatePromises = pendingBalances.map((pb) =>
        tx.pendingBalanceRecord.update({
          where: { id: pb.id },
          data: {
            status: PendingBalanceStatus.RELEASED,
            releasedAt: new Date(),
          },
        })
      );
      await Promise.all(updatePromises);

      // Update saldo supplier (salesBalance +, pendingBalance -)
      const userAmounts = new Map<string, number>();
      pendingBalances.forEach((pb) => {
        const current = userAmounts.get(pb.userId) || 0;
        userAmounts.set(pb.userId, current + pb.amount);
      });

      const userUpdatePromises = Array.from(userAmounts.entries()).map(
        ([userId, amount]) =>
          tx.user.update({
            where: { id: userId },
            data: {
              salesBalance: { increment: amount },
              pendingBalance: { decrement: amount },
            },
          })
      );
      await Promise.all(userUpdatePromises);

      // Buat balance log
      const balanceLogs = pendingBalances.map((pb) => ({
        userId: pb.userId,
        amount: pb.amount,
        type: "SALES_RELEASED", // Pastikan enum LogType memiliki nilai ini
        description: `Sales released for transaction ${pb.transactionId}`,
      }));
      await tx.balanceLog.createMany({
        data: balanceLogs,
      });

      return {
        count: pendingBalances.length,
        totalAmount: Array.from(userAmounts.values()).reduce(
          (a, b) => a + b,
          0
        ),
      };
    });

    return NextResponse.json({
      message: "Balances released successfully",
      count: result.count,
      totalAmount: result.totalAmount,
    });
  } catch (error) {
    console.error("Error bulk updating pending balances:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update pending balances",
      },
      { status: 500 }
    );
  }
}
