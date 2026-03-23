import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role, LogType, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Filter parameters
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Build where condition for balance logs
    const where: Prisma.BalanceLogWhereInput = {};

    // Date range filter
    if (from || to) {
      where.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        where.createdAt.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Type filter
    if (type && type !== "ALL") {
      if (Object.values(LogType).includes(type as LogType)) {
        where.type = type as LogType;
      } else {
        return NextResponse.json(
          { error: "Invalid type filter" },
          { status: 400 }
        );
      }
    }

    // Get total count
    const total = await db.balanceLog.count({ where });

    // Get paginated balance logs
    const balanceLogs = await db.balanceLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true } },
      },
    });

    // Calculate stats with the same filters
    // Total Volume from transactions (with date filter if any)
    let totalVolume = 0;
    if (from || to) {
      const txWhere: Prisma.TransactionWhereInput = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        txWhere.createdAt = { gte: fromDate };
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        txWhere.createdAt = { ...txWhere.createdAt, lte: toDate };
      }
      const transactions = await db.transaction.findMany({
        where: txWhere,
        select: { finalPrice: true },
      });
      totalVolume = transactions.reduce((sum, t) => sum + t.finalPrice, 0);
    } else {
      const transactions = await db.transaction.findMany({
        select: { finalPrice: true },
      });
      totalVolume = transactions.reduce((sum, t) => sum + t.finalPrice, 0);
    }

    // Total Top-ups (with filters)
    const topupWhere: Prisma.BalanceLogWhereInput = {
      ...where,
      type: LogType.TOPUP,
    };
    const topups = await db.balanceLog.findMany({
      where: topupWhere,
      select: { amount: true },
    });
    const totalTopups = topups.reduce((sum, t) => sum + t.amount, 0);

    // Active Users
    let activeUsers = 0;
    if (from || to) {
      activeUsers = await db.user.count({
        where: {
          balanceLogs: {
            some: {
              createdAt: where.createdAt,
            },
          },
        },
      });
    } else {
      activeUsers = await db.user.count({
        where: {
          OR: [
            { balance: { gt: 0 } },
            {
              balanceLogs: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          ],
        },
      });
    }

    // Total Sales
    let totalSales = 0;
    if (from || to) {
      const txWhere: Prisma.TransactionWhereInput = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        txWhere.createdAt = { gte: fromDate };
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        txWhere.createdAt = { ...txWhere.createdAt, lte: toDate };
      }
      totalSales = await db.transaction.count({ where: txWhere });
    } else {
      totalSales = await db.transaction.count();
    }

    return NextResponse.json({
      data: balanceLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalVolume,
        totalTopups,
        activeUsers,
        totalSales,
      },
    });
  } catch (error) {
    console.error("Error fetching finance stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
