// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { getToken } from "next-auth/jwt";
// import { Role, ActivityAction } from "@prisma/client";
// import { logActivityWithContext } from "@/lib/activity";
// import { writeFile, mkdir, unlink } from "fs/promises";
// import { existsSync } from "fs";
// import path from "path";

// // Helper untuk menyimpan file
// async function saveFile(file: File): Promise<string> {
//   const bytes = await file.arrayBuffer();
//   const buffer = Buffer.from(bytes);

//   const uploadDir = path.join(
//     process.cwd(),
//     "public",
//     "uploads",
//     "weapons-master",
//   );
//   if (!existsSync(uploadDir)) {
//     await mkdir(uploadDir, { recursive: true });
//   }

//   const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//   const fileExtension = file.name.split(".").pop();
//   const fileName = `weapon-${uniqueSuffix}.${fileExtension}`;
//   const filePath = path.join(uploadDir, fileName);

//   await writeFile(filePath, buffer);
//   return `/uploads/weapons-master/${fileName}`;
// }

// // Helper untuk menghapus file
// async function deleteFile(publicPath: string | null) {
//   if (!publicPath) return;
//   try {
//     const filePath = path.join(process.cwd(), "public", publicPath);
//     if (existsSync(filePath)) {
//       await unlink(filePath);
//     }
//   } catch (error) {
//     console.error("Failed to delete weapon file:", error);
//   }
// }

// // GET - List all weapons
// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const search = searchParams.get("search");
//     const gameId = searchParams.get("gameId");

//     const where: Record<string, unknown> = {};

//     if (search) {
//       where.name = { contains: search };
//     }

//     if (gameId && gameId !== "all") {
//       where.gameId = gameId;
//     }

//     const weapons = await db.weapon.findMany({
//       where,
//       include: {
//         game: { select: { id: true, name: true, code: true } },
//         _count: { select: { accounts: true } },
//       },
//       orderBy: [{ game: { name: "asc" } }, { name: "asc" }],
//     });

//     return NextResponse.json({ weapons });
//   } catch (error) {
//     console.error("Error fetching weapons:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch weapons" },
//       { status: 500 },
//     );
//   }
// }

// // POST - Create new weapon
// export async function POST(request: NextRequest) {
//   try {
//     const token = await getToken({ req: request });
//     if (!token || token.role !== Role.SUPER_ADMIN) {
//       return NextResponse.json(
//         { error: "Unauthorized - Super Admin only" },
//         { status: 401 },
//       );
//     }

//     const formData = await request.formData();
//     const gameId = formData.get("gameId") as string;
//     const name = formData.get("name") as string;
//     const rarity = formData.get("rarity") as string;
//     const weaponType = formData.get("weaponType") as string;
//     const element = formData.get("element") as string;
//     const imageFile = formData.get("image") as File | null;

//     if (!gameId || !name) {
//       return NextResponse.json(
//         { error: "Game and weapon name are required" },
//         { status: 400 },
//       );
//     }

//     const existing = await db.weapon.findUnique({
//       where: { gameId_name: { gameId, name } },
//     });

//     if (existing) {
//       return NextResponse.json(
//         { error: "Weapon with this name already exists for this game" },
//         { status: 400 },
//       );
//     }

//     let imageUrl: string | null = null;
//     if (imageFile && imageFile.size > 0) {
//       imageUrl = await saveFile(imageFile);
//     }

//     const weapon = await db.weapon.create({
//       data: {
//         gameId,
//         name,
//         imageUrl,
//         rarity: rarity ? parseInt(rarity) : null,
//         weaponType: weaponType || null,
//         element: element || null,
//       },
//       include: { game: { select: { id: true, name: true, code: true } } },
//     });

//     await logActivityWithContext(
//       {
//         action: ActivityAction.WEAPON_CREATE,
//         userId: token.id as string,
//         entityType: "Weapon",
//         entityId: weapon.id,
//         entityName: weapon.name,
//         details: {
//           gameName: weapon.game.name,
//           rarity: weapon.rarity,
//           weaponType: weapon.weaponType,
//         },
//       },
//       request,
//     );

//     return NextResponse.json({ weapon }, { status: 201 });
//   } catch (error) {
//     console.error("Error creating weapon:", error);
//     return NextResponse.json(
//       { error: "Failed to create weapon" },
//       { status: 500 },
//     );
//   }
// }

// // PUT - Update weapon
// export async function PUT(request: NextRequest) {
//   try {
//     const token = await getToken({ req: request });
//     if (!token || token.role !== Role.SUPER_ADMIN) {
//       return NextResponse.json(
//         { error: "Unauthorized - Super Admin only" },
//         { status: 401 },
//       );
//     }

//     const formData = await request.formData();
//     const id = formData.get("id") as string;
//     const name = formData.get("name") as string;
//     const rarity = formData.get("rarity") as string;
//     const weaponType = formData.get("weaponType") as string;
//     const element = formData.get("element") as string;
//     const imageFile = formData.get("image") as File | null;
//     const removeImage = formData.get("removeImage") === "true";

//     if (!id) {
//       return NextResponse.json(
//         { error: "Weapon ID is required" },
//         { status: 400 },
//       );
//     }

//     const existing = await db.weapon.findUnique({
//       where: { id },
//       include: { game: true },
//     });

//     if (!existing) {
//       return NextResponse.json({ error: "Weapon not found" }, { status: 404 });
//     }

//     if (name && name !== existing.name) {
//       const duplicate = await db.weapon.findUnique({
//         where: { gameId_name: { gameId: existing.gameId, name } },
//       });
//       if (duplicate) {
//         return NextResponse.json(
//           { error: "Weapon with this name already exists for this game" },
//           { status: 400 },
//         );
//       }
//     }

//     let imageUrl = existing.imageUrl;

//     if (removeImage) {
//       await deleteFile(existing.imageUrl);
//       imageUrl = null;
//     } else if (imageFile && imageFile.size > 0) {
//       await deleteFile(existing.imageUrl);
//       imageUrl = await saveFile(imageFile);
//     }

//     const weapon = await db.weapon.update({
//       where: { id },
//       data: {
//         name: name || existing.name,
//         imageUrl,
//         rarity:
//           rarity !== undefined
//             ? rarity
//               ? parseInt(rarity)
//               : null
//             : existing.rarity,
//         weaponType: weaponType !== undefined ? weaponType : existing.weaponType,
//         element: element !== undefined ? element : existing.element,
//       },
//       include: { game: { select: { id: true, name: true, code: true } } },
//     });

//     await logActivityWithContext(
//       {
//         action: ActivityAction.WEAPON_UPDATE,
//         userId: token.id as string,
//         entityType: "Weapon",
//         entityId: weapon.id,
//         entityName: weapon.name,
//         details: {
//           gameName: weapon.game.name,
//           changes: { name, rarity, weaponType, element },
//         },
//       },
//       request,
//     );

//     return NextResponse.json({ weapon });
//   } catch (error) {
//     console.error("Error updating weapon:", error);
//     return NextResponse.json(
//       { error: "Failed to update weapon" },
//       { status: 500 },
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { Role, ActivityAction } from "@prisma/client";
import { logActivityWithContext } from "@/lib/activity";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Helper: Simpan file fisik di public, return URL API
async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 1. Path fisik: public/uploads/weapons-master
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "weapons-master",
  );

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // 2. Generate nama file unik
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileExtension = file.name.split(".").pop();
  const fileName = `weapon-${uniqueSuffix}.${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);

  // 3. Tulis file ke disk
  await writeFile(filePath, buffer);

  // 4. Kembalikan URL API Route (PENTING)
  return `/api/uploads/weapons-master/${fileName}`;
}

// Helper: Hapus file berdasarkan URL API
async function deleteFile(apiUrl: string | null) {
  if (!apiUrl) return;
  try {
    // Ubah URL API menjadi nama file
    // Contoh: /api/uploads/weapons-master/file.jpg -> file.jpg
    const fileName = apiUrl.split("/").pop();
    if (!fileName) return;

    // Path fisik: public/uploads/weapons-master/file.jpg
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
    console.error("Failed to delete weapon file:", error);
  }
}

// GET - List all weapons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const gameId = searchParams.get("gameId");

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search };
    }

    if (gameId && gameId !== "all") {
      where.gameId = gameId;
    }

    const weapons = await db.weapon.findMany({
      where,
      include: {
        game: { select: { id: true, name: true, code: true } },
        _count: { select: { accounts: true } },
      },
      orderBy: [{ game: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json({ weapons });
  } catch (error) {
    console.error("Error fetching weapons:", error);
    return NextResponse.json(
      { error: "Failed to fetch weapons" },
      { status: 500 },
    );
  }
}

// POST - Create new weapon
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const gameId = formData.get("gameId") as string;
    const name = formData.get("name") as string;
    const rarity = formData.get("rarity") as string;
    const weaponType = formData.get("weaponType") as string;
    const element = formData.get("element") as string;
    const imageFile = formData.get("image") as File | null;

    if (!gameId || !name) {
      return NextResponse.json(
        { error: "Game and weapon name are required" },
        { status: 400 },
      );
    }

    const existing = await db.weapon.findUnique({
      where: { gameId_name: { gameId, name } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Weapon with this name already exists for this game" },
        { status: 400 },
      );
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveFile(imageFile);
    }

    const weapon = await db.weapon.create({
      data: {
        gameId,
        name,
        imageUrl,
        rarity: rarity ? parseInt(rarity) : null,
        weaponType: weaponType || null,
        element: element || null,
      },
      include: { game: { select: { id: true, name: true, code: true } } },
    });

    await logActivityWithContext(
      {
        action: ActivityAction.WEAPON_CREATE,
        userId: token.id as string,
        entityType: "Weapon",
        entityId: weapon.id,
        entityName: weapon.name,
        details: {
          gameName: weapon.game.name,
          rarity: weapon.rarity,
          weaponType: weapon.weaponType,
        },
      },
      request,
    );

    return NextResponse.json({ weapon }, { status: 201 });
  } catch (error) {
    console.error("Error creating weapon:", error);
    return NextResponse.json(
      { error: "Failed to create weapon" },
      { status: 500 },
    );
  }
}

// PUT - Update weapon
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const rarity = formData.get("rarity") as string;
    const weaponType = formData.get("weaponType") as string;
    const element = formData.get("element") as string;
    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage") === "true";

    if (!id) {
      return NextResponse.json(
        { error: "Weapon ID is required" },
        { status: 400 },
      );
    }

    const existing = await db.weapon.findUnique({
      where: { id },
      include: { game: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Weapon not found" }, { status: 404 });
    }

    if (name && name !== existing.name) {
      const duplicate = await db.weapon.findUnique({
        where: { gameId_name: { gameId: existing.gameId, name } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Weapon with this name already exists for this game" },
          { status: 400 },
        );
      }
    }

    let imageUrl = existing.imageUrl;

    if (removeImage) {
      await deleteFile(existing.imageUrl);
      imageUrl = null;
    } else if (imageFile && imageFile.size > 0) {
      await deleteFile(existing.imageUrl);
      imageUrl = await saveFile(imageFile);
    }

    const weapon = await db.weapon.update({
      where: { id },
      data: {
        name: name || existing.name,
        imageUrl,
        rarity:
          rarity !== undefined
            ? rarity
              ? parseInt(rarity)
              : null
            : existing.rarity,
        weaponType: weaponType !== undefined ? weaponType : existing.weaponType,
        element: element !== undefined ? element : existing.element,
      },
      include: { game: { select: { id: true, name: true, code: true } } },
    });

    await logActivityWithContext(
      {
        action: ActivityAction.WEAPON_UPDATE,
        userId: token.id as string,
        entityType: "Weapon",
        entityId: weapon.id,
        entityName: weapon.name,
        details: {
          gameName: weapon.game.name,
          changes: { name, rarity, weaponType, element },
        },
      },
      request,
    );

    return NextResponse.json({ weapon });
  } catch (error) {
    console.error("Error updating weapon:", error);
    return NextResponse.json(
      { error: "Failed to update weapon" },
      { status: 500 },
    );
  }
}
