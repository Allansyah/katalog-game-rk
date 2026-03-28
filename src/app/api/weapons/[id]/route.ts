// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { getToken } from "next-auth/jwt";
// import { Role, ActivityAction } from "@prisma/client";
// import { logActivityWithContext } from "@/lib/activity";
// import { unlink } from "fs/promises";
// import { existsSync } from "fs";
// import path from "path";

// async function deleteFile(publicPath: string | null) {
//   if (!publicPath) return;
//   try {
//     const filePath = path.join(process.cwd(), "public", publicPath);
//     if (existsSync(filePath)) {
//       await unlink(filePath);
//     }
//   } catch (error) {
//     console.error("Failed to delete file:", error);
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const token = await getToken({ req: request });

//     if (!token || token.role !== Role.SUPER_ADMIN) {
//       return NextResponse.json(
//         { error: "Unauthorized - Super Admin only" },
//         { status: 401 },
//       );
//     }

//     const { id } = await params;

//     const weapon = await db.weapon.findUnique({
//       where: { id },
//       include: {
//         game: { select: { name: true } },
//         _count: { select: { accounts: true } },
//       },
//     });

//     if (!weapon) {
//       return NextResponse.json({ error: "Weapon not found" }, { status: 404 });
//     }

//     if (weapon._count.accounts > 0) {
//       return NextResponse.json(
//         { error: "Cannot delete weapon used in accounts" },
//         { status: 400 },
//       );
//     }

//     // Hapus file gambar dari disk
//     await deleteFile(weapon.imageUrl);

//     await db.weapon.delete({ where: { id } });

//     await logActivityWithContext(
//       {
//         action: ActivityAction.WEAPON_DELETE,
//         userId: token.id as string,
//         entityType: "Weapon",
//         entityId: id,
//         entityName: weapon.name,
//         details: { gameName: weapon.game.name },
//       },
//       request,
//     );

//     return NextResponse.json({ message: "Weapon deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting weapon:", error);
//     return NextResponse.json(
//       { error: "Failed to delete weapon" },
//       { status: 500 },
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role, ActivityAction } from "@prisma/client";
import { logActivityWithContext } from "@/lib/activity";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Helper: Hapus file berdasarkan URL API
async function deleteFile(apiUrl: string | null) {
  if (!apiUrl) return;
  try {
    // Ubah URL API menjadi nama file
    const fileName = apiUrl.split("/").pop();
    if (!fileName) return;

    // Path fisik
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "weapons-master",
      fileName,
    );

    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    console.error("Failed to delete file:", error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const weapon = await db.weapon.findUnique({
      where: { id },
      include: {
        game: { select: { name: true } },
        _count: { select: { accounts: true } },
      },
    });

    if (!weapon) {
      return NextResponse.json({ error: "Weapon not found" }, { status: 404 });
    }

    if (weapon._count.accounts > 0) {
      return NextResponse.json(
        { error: "Cannot delete weapon used in accounts" },
        { status: 400 },
      );
    }

    // Hapus file gambar dari disk
    await deleteFile(weapon.imageUrl);

    await db.weapon.delete({ where: { id } });

    await logActivityWithContext(
      {
        action: ActivityAction.WEAPON_DELETE,
        userId: token.id as string,
        entityType: "Weapon",
        entityId: id,
        entityName: weapon.name,
        details: { gameName: weapon.game.name },
      },
      request,
    );

    return NextResponse.json({ message: "Weapon deleted successfully" });
  } catch (error) {
    console.error("Error deleting weapon:", error);
    return NextResponse.json(
      { error: "Failed to delete weapon" },
      { status: 500 },
    );
  }
}
