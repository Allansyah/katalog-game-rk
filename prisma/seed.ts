import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

// Fungsi untuk mengenkripsi data login (dummy encryption untuk seed)
function encryptDummy(data: object): string {
  const json = JSON.stringify(data);
  // Di production, gunakan AES-256 yang proper. Untuk seed, kita cukup encode base64.
  return Buffer.from(json).toString("base64");
}

// Fungsi untuk generate publicId dengan format: GAMECODE-TIMESTAMP-RANDOM
function generatePublicId(gameCode: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${gameCode}-${timestamp}-${random}`;
}

async function main() {
  console.log("🌱 Starting seed...");

  // Create Reseller Tiers (sama seperti sebelumnya)
  const tiers = await Promise.all([
    prisma.resellerTier.upsert({
      where: { id: "tier-bronze" },
      update: {},
      create: {
        id: "tier-bronze",
        name: "Bronze",
        discountPercent: 5,
        minTotalSales: 0,
        color: "#CD7F32",
        isDefault: true,
      },
    }),
    prisma.resellerTier.upsert({
      where: { id: "tier-silver" },
      update: {},
      create: {
        id: "tier-silver",
        name: "Silver",
        discountPercent: 10,
        minTotalSales: 1000000,
        color: "#C0C0C0",
        isDefault: false,
      },
    }),
    prisma.resellerTier.upsert({
      where: { id: "tier-gold" },
      update: {},
      create: {
        id: "tier-gold",
        name: "Gold",
        discountPercent: 15,
        minTotalSales: 5000000,
        color: "#FFD700",
        isDefault: false,
      },
    }),
    prisma.resellerTier.upsert({
      where: { id: "tier-platinum" },
      update: {},
      create: {
        id: "tier-platinum",
        name: "Platinum",
        discountPercent: 20,
        minTotalSales: 15000000,
        color: "#E5E4E2",
        isDefault: false,
      },
    }),
  ]);

  console.log("✅ Created tiers:", tiers.map((t) => t.name).join(", "));

  // Create Users (sama seperti sebelumnya)
  const passwordHash = await hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@catalog.com" },
    update: {},
    create: {
      email: "admin@catalog.com",
      name: "Super Admin",
      passwordHash,
      role: Role.SUPER_ADMIN,
      balance: 0,
      salesBalance: 0,
      pendingBalance: 0,
    },
  });

  const supplierPassword = await hash("123456", 10);
  const supplier = await prisma.user.upsert({
    where: { email: "supplier@catalog.com" },
    update: {},
    create: {
      email: "supplier@catalog.com",
      name: "Supplier Demo",
      passwordHash: supplierPassword,
      role: Role.SUPPLIER,
      balance: 500000,
      salesBalance: 1500000,
      pendingBalance: 500000,
    },
  });

  const resellerPassword = await hash("123456", 10);
  const reseller = await prisma.user.upsert({
    where: { email: "reseller@catalog.com" },
    update: {},
    create: {
      email: "reseller@catalog.com",
      name: "Reseller Demo",
      passwordHash: resellerPassword,
      role: Role.RESELLER,
      balance: 1000000,
      tierId: "tier-bronze",
      totalSpent: 0,
    },
  });

  console.log("✅ Created users:");
  console.log("   - admin@catalog.com (password: 123456) - SUPER_ADMIN");
  console.log("   - supplier@catalog.com (password: 123456) - SUPPLIER");
  console.log("   - reseller@catalog.com (password: 123456) - RESELLER");

  // Create Games (sama seperti sebelumnya)
  const mlGame = await prisma.game.upsert({
    where: { code: "ML" },
    update: {},
    create: {
      name: "Mobile Legends",
      code: "ML",
      status: true,
    },
  });

  const giGame = await prisma.game.upsert({
    where: { code: "GI" },
    update: {},
    create: {
      name: "Genshin Impact",
      code: "GI",
      status: true,
    },
  });

  const ffGame = await prisma.game.upsert({
    where: { code: "FF" },
    update: {},
    create: {
      name: "Free Fire",
      code: "FF",
      status: true,
    },
  });

  console.log(
    "✅ Created games:",
    [mlGame, giGame, ffGame].map((g) => g.name).join(", ")
  );

  // Create Characters for Mobile Legends (sama seperti sebelumnya)
  const mlCharacters = await Promise.all([
    prisma.character.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Layla" } },
      update: {},
      create: { gameId: mlGame.id, name: "Layla", rarity: 1 },
    }),
    prisma.character.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Miya" } },
      update: {},
      create: { gameId: mlGame.id, name: "Miya", rarity: 1 },
    }),
    prisma.character.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Zilong" } },
      update: {},
      create: { gameId: mlGame.id, name: "Zilong", rarity: 1 },
    }),
    prisma.character.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Chou" } },
      update: {},
      create: { gameId: mlGame.id, name: "Chou", rarity: 3 },
    }),
    prisma.character.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Gusion" } },
      update: {},
      create: { gameId: mlGame.id, name: "Gusion", rarity: 3 },
    }),
  ]);

  console.log("✅ Created ML characters:", mlCharacters.length);

  // Create Weapons for Games (sama seperti sebelumnya)
  const mlWeapons = await Promise.all([
    prisma.weapon.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Endless Battle" } },
      update: {},
      create: {
        gameId: mlGame.id,
        name: "Endless Battle",
        rarity: 3,
        weaponType: "Other",
      },
    }),
    prisma.weapon.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Berserker's Fury" } },
      update: {},
      create: {
        gameId: mlGame.id,
        name: "Berserker's Fury",
        rarity: 3,
        weaponType: "Other",
      },
    }),
    prisma.weapon.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Blade of Despair" } },
      update: {},
      create: {
        gameId: mlGame.id,
        name: "Blade of Despair",
        rarity: 3,
        weaponType: "Sword",
      },
    }),
  ]);

  const giWeapons = await Promise.all([
    prisma.weapon.upsert({
      where: {
        gameId_name: { gameId: giGame.id, name: "Mistsplitter Reforged" },
      },
      update: {},
      create: {
        gameId: giGame.id,
        name: "Mistsplitter Reforged",
        rarity: 5,
        weaponType: "Sword",
        element: "Cryo",
      },
    }),
    prisma.weapon.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "Staff of Homa" } },
      update: {},
      create: {
        gameId: giGame.id,
        name: "Staff of Homa",
        rarity: 5,
        weaponType: "Polearm",
        element: "Pyro",
      },
    }),
    prisma.weapon.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "Amos' Bow" } },
      update: {},
      create: {
        gameId: giGame.id,
        name: "Amos' Bow",
        rarity: 5,
        weaponType: "Bow",
      },
    }),
    prisma.weapon.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "Sacrificial Sword" } },
      update: {},
      create: {
        gameId: giGame.id,
        name: "Sacrificial Sword",
        rarity: 4,
        weaponType: "Sword",
      },
    }),
  ]);

  console.log("✅ Created ML weapons:", mlWeapons.length);
  console.log("✅ Created GI weapons:", giWeapons.length);

  // Create Servers for Games (sama seperti sebelumnya)
  const mlServers = await Promise.all([
    prisma.server.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Indonesia" } },
      update: {},
      create: {
        gameId: mlGame.id,
        name: "Indonesia",
        code: "ID",
        status: true,
      },
    }),
    prisma.server.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Malaysia" } },
      update: {},
      create: { gameId: mlGame.id, name: "Malaysia", code: "MY", status: true },
    }),
    prisma.server.upsert({
      where: { gameId_name: { gameId: mlGame.id, name: "Singapore" } },
      update: {},
      create: {
        gameId: mlGame.id,
        name: "Singapore",
        code: "SG",
        status: true,
      },
    }),
  ]);

  const giServers = await Promise.all([
    prisma.server.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "America" } },
      update: {},
      create: { gameId: giGame.id, name: "America", code: "US", status: true },
    }),
    prisma.server.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "Europe" } },
      update: {},
      create: { gameId: giGame.id, name: "Europe", code: "EU", status: true },
    }),
    prisma.server.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "Asia" } },
      update: {},
      create: { gameId: giGame.id, name: "Asia", code: "ASIA", status: true },
    }),
    prisma.server.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "TW/HK/MO" } },
      update: {},
      create: { gameId: giGame.id, name: "TW/HK/MO", code: "TW", status: true },
    }),
  ]);

  const ffServers = await Promise.all([
    prisma.server.upsert({
      where: { gameId_name: { gameId: ffGame.id, name: "Indonesia" } },
      update: {},
      create: {
        gameId: ffGame.id,
        name: "Indonesia",
        code: "ID",
        status: true,
      },
    }),
    prisma.server.upsert({
      where: { gameId_name: { gameId: ffGame.id, name: "Malaysia" } },
      update: {},
      create: { gameId: ffGame.id, name: "Malaysia", code: "MY", status: true },
    }),
  ]);

  console.log("✅ Created ML servers:", mlServers.length);
  console.log("✅ Created GI servers:", giServers.length);
  console.log("✅ Created FF servers:", ffServers.length);

  // ------------------------------------------------------------------
  // TAMBAHAN: Membuat contoh Account untuk supplier dengan multi karakter & weapon + quantity
  // ------------------------------------------------------------------

  // Ambil server yang sudah dibuat
  const mlServerId = mlServers.find((s) => s.code === "ID")?.id;
  const giServerId = giServers.find((s) => s.code === "ASIA")?.id;

  // Data login dummy untuk dienkripsi
  const loginData = {
    username: "user_demo",
    password: "pass123",
    email: "demo@mail.com",
  };
  const encrypted = encryptDummy(loginData);

  // Buat beberapa akun
  const account1 = await prisma.account.create({
    data: {
      publicId: generatePublicId("ML"),
      gameId: mlGame.id,
      supplierId: supplier.id,
      serverId: mlServerId,
      level: 120,
      diamond: 5000,
      gender: "MALE",
      basePrice: 250000,
      status: "AVAILABLE",
      encryptedLogin: encrypted,
      characters: {
        create: [
          {
            characterId: mlCharacters.find((c) => c.name === "Layla")!.id,
            quantity: 2,
          },
          {
            characterId: mlCharacters.find((c) => c.name === "Gusion")!.id,
            quantity: 3,
          },
          {
            characterId: mlCharacters.find((c) => c.name === "Chou")!.id,
            quantity: 1,
          },
        ],
      },
      weapons: {
        create: [
          {
            weaponId: mlWeapons.find((w) => w.name === "Blade of Despair")!.id,
            quantity: 1,
          },
          {
            weaponId: mlWeapons.find((w) => w.name === "Endless Battle")!.id,
            quantity: 2,
          },
        ],
      },
    },
  });

  const account2 = await prisma.account.create({
    data: {
      publicId: generatePublicId("GI"),
      gameId: giGame.id,
      supplierId: supplier.id,
      serverId: giServerId,
      level: 55,
      diamond: 12000,
      gender: "FEMALE",
      basePrice: 500000,
      status: "AVAILABLE",
      encryptedLogin: encryptDummy({ ...loginData, username: "traveler_gi" }),
      characters: {
        create: [
          // Untuk Genshin, kita belum membuat character di seed. Jadi kita perlu membuat beberapa karakter GI dulu.
          // Mari kita buat beberapa karakter GI setelah ini.
        ],
      },
      weapons: {
        create: [
          {
            weaponId: giWeapons.find((w) => w.name === "Mistsplitter Reforged")!
              .id,
            quantity: 1,
          },
          {
            weaponId: giWeapons.find((w) => w.name === "Sacrificial Sword")!.id,
            quantity: 2,
          },
        ],
      },
    },
  });

  // Karena GI belum punya karakter, kita buat beberapa karakter GI dulu.
  const giCharacters = await Promise.all([
    prisma.character.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "Hu Tao" } },
      update: {},
      create: { gameId: giGame.id, name: "Hu Tao", rarity: 5, element: "Pyro" },
    }),
    prisma.character.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "Zhongli" } },
      update: {},
      create: { gameId: giGame.id, name: "Zhongli", rarity: 5, element: "Geo" },
    }),
    prisma.character.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "Xingqiu" } },
      update: {},
      create: {
        gameId: giGame.id,
        name: "Xingqiu",
        rarity: 4,
        element: "Hydro",
      },
    }),
    prisma.character.upsert({
      where: { gameId_name: { gameId: giGame.id, name: "Bennett" } },
      update: {},
      create: {
        gameId: giGame.id,
        name: "Bennett",
        rarity: 4,
        element: "Pyro",
      },
    }),
  ]);

  // Update account2 dengan karakter
  await prisma.account.update({
    where: { id: account2.id },
    data: {
      characters: {
        create: [
          {
            characterId: giCharacters.find((c) => c.name === "Hu Tao")!.id,
            quantity: 1,
          },
          {
            characterId: giCharacters.find((c) => c.name === "Zhongli")!.id,
            quantity: 1,
          },
          {
            characterId: giCharacters.find((c) => c.name === "Xingqiu")!.id,
            quantity: 3,
          },
          {
            characterId: giCharacters.find((c) => c.name === "Bennett")!.id,
            quantity: 2,
          },
        ],
      },
    },
  });

  console.log(
    "✅ Created sample accounts with characters & weapons (with quantity):"
  );
  console.log(
    `   - ML Account: ${account1.publicId} (Rp ${account1.basePrice}) - Layla x2, Gusion x3, Chou x1`
  );
  console.log(
    `   - GI Account: ${account2.publicId} (Rp ${account2.basePrice}) - Hu Tao, Zhongli, Xingqiu x3, Bennett x2`
  );

  // ------------------------------------------------------------------
  // Lanjut ke pembuatan Payment Methods, Topup Packages, Platform Settings
  // ------------------------------------------------------------------

  // Create Payment Methods
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.upsert({
      where: { id: "pm-bca" },
      update: {},
      create: {
        id: "pm-bca",
        name: "BCA",
        type: "BANK_TRANSFER",
        accountNo: "1234567890",
        accountName: "Rikkastore",
        status: true,
      },
    }),
    prisma.paymentMethod.upsert({
      where: { id: "pm-mandiri" },
      update: {},
      create: {
        id: "pm-mandiri",
        name: "Mandiri",
        type: "BANK_TRANSFER",
        accountNo: "0987654321",
        accountName: "Rikkastore",
        status: true,
      },
    }),
    prisma.paymentMethod.upsert({
      where: { id: "pm-dana" },
      update: {},
      create: {
        id: "pm-dana",
        name: "DANA",
        type: "E_WALLET",
        accountNo: "081234567890",
        accountName: "Rikkastore",
        status: true,
      },
    }),
  ]);

  console.log(
    "✅ Created payment methods:",
    paymentMethods.map((p) => p.name).join(", ")
  );

  // Create Topup Packages
  const topupPackages = await Promise.all([
    prisma.topupPackage.upsert({
      where: { id: "pkg-10k" },
      update: {},
      create: {
        id: "pkg-10k",
        amount: 10000,
        bonus: 0,
        isActive: true,
      },
    }),
    prisma.topupPackage.upsert({
      where: { id: "pkg-25k" },
      update: {},
      create: {
        id: "pkg-25k",
        amount: 25000,
        bonus: 0,
        isActive: true,
      },
    }),
    prisma.topupPackage.upsert({
      where: { id: "pkg-50k" },
      update: {},
      create: {
        id: "pkg-50k",
        amount: 50000,
        bonus: 5000,
        isActive: true,
      },
    }),
    prisma.topupPackage.upsert({
      where: { id: "pkg-100k" },
      update: {},
      create: {
        id: "pkg-100k",
        amount: 100000,
        bonus: 15000,
        isActive: true,
      },
    }),
  ]);

  console.log("✅ Created topup packages:", topupPackages.length);

  // Create Platform Settings
  await prisma.platformSettings.upsert({
    where: { id: "platform-settings" },
    update: {},
    create: {
      id: "platform-settings",
      platformFee: 20,
    },
  });

  console.log("✅ Created platform settings (fee: 20%)");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test Accounts:");
  console.log("┌─────────────────────────┬──────────────┬─────────────┐");
  console.log("│ Email                   │ Password     │ Role        │");
  console.log("├─────────────────────────┼──────────────┼─────────────┤");
  console.log("│ admin@catalog.com       │ 123456       │ SUPER_ADMIN │");
  console.log("│ supplier@catalog.com    │ 123456       │ SUPPLIER    │");
  console.log("│ reseller@catalog.com    │ 123456       │ RESELLER    │");
  console.log("└─────────────────────────┴──────────────┴─────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
