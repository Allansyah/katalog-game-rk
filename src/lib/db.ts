import {
  PrismaClient,
  Role,
  AccountStatus,
  LogType,
  TopupRequestStatus,
  ActivityAction,
  TopupRequestStatus as RequestStatus,
} from "@prisma/client";

// 1. Setup Global Cache (Cegah koneksi bocor di Next.js Dev Mode)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 2. Fungsi untuk membuat instance Prisma baru
function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// 3. Logic pengecekan model (Menghindari error saat schema baru di-generate)
function hasAllModels(client: PrismaClient): boolean {
  return "server" in client && "weapon" in client;
}

let cachedClient = globalForPrisma.prisma;

if (cachedClient && !hasAllModels(cachedClient)) {
  cachedClient.$disconnect().catch(() => {});
  cachedClient = undefined;
  globalForPrisma.prisma = undefined;
}

// 4. EXPORT UTAMA (Instance Database)
export const db = cachedClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// 5. EXPORT ENUMS (Value untuk logic runtime seperti Role.SUPER_ADMIN)
// Tambahkan Enum lain di sini jika nanti kamu menambahkannya di schema.prisma
export {
  Role,
  AccountStatus,
  LogType,
  TopupRequestStatus,
  ActivityAction,
  //   WithdrawalStatus,
  //   WithdrawalType,
  //   PendingBalanceStatus,
};

// 6. EXPORT TYPES (Biar Next.js/Turbopack tidak komplain 'unexpected export *')
export type * from "@prisma/client";
