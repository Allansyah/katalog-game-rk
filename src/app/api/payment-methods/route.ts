import { db, Role } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Helper untuk menyimpan file
async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public/uploads/qris");

  // Buat folder jika belum ada
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate nama file unik
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const extension = file.name.split(".").pop();
  const filename = `qris-${uniqueSuffix}.${extension}`;
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);

  // Kembalikan path publik untuk disimpan di DB
  return `/uploads/qris/${filename}`;
}

export async function GET() {
  try {
    const methods = await db.paymentMethod.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ methods });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 },
    );
  }
}

// ... imports dan helper function saveFile tetap sama

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const accountNo = formData.get("accountNo") as string;
    const accountName = formData.get("accountName") as string;
    const instructions = formData.get("instructions") as string;
    const status = formData.get("status") === "true";
    const file = formData.get("file") as File | null;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 },
      );
    }

    // PERBAIKAN: Beri tipe eksplisit string | null
    let imageUrl: string | null = null;

    if (type === "QRIS" && file && file.size > 0) {
      imageUrl = await saveFile(file);
    }

    const method = await db.paymentMethod.create({
      data: {
        name,
        type,
        accountNo: type !== "QRIS" ? accountNo : null,
        accountName: type !== "QRIS" ? accountName : null,
        imageUrl,
        instructions,
        status: status ?? true,
      },
    });

    return NextResponse.json({ method }, { status: 201 });
  } catch (error) {
    console.error("Error creating payment method:", error);
    return NextResponse.json(
      { error: "Failed to create payment method" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const accountNo = formData.get("accountNo") as string;
    const accountName = formData.get("accountName") as string;
    const instructions = formData.get("instructions") as string;
    const status = formData.get("status") === "true";
    const file = formData.get("file") as File | null;
    // existingImageUrl bisa string (path) atau null
    const existingImageUrl = formData.get("existingImageUrl") as string | null;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // PERBAIKAN: Beri tipe eksplisit string | null
    let imageUrl: string | null = existingImageUrl;

    // Jika ada file baru diupload, simpan dan update URL
    if (type === "QRIS" && file && file.size > 0) {
      imageUrl = await saveFile(file);
    }

    const method = await db.paymentMethod.update({
      where: { id },
      data: {
        name,
        type,
        accountNo: type !== "QRIS" ? accountNo : null,
        accountName: type !== "QRIS" ? accountName : null,
        imageUrl,
        instructions,
        status,
      },
    });

    return NextResponse.json({ method });
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 },
    );
  }
}

// ... fungsi DELETE tetap sama

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.paymentMethod.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 },
    );
  }
}
