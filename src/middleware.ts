import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const publicRoutes = [
  "/",
  "/catalog",
  "/login",
  "/api/auth",
  "/api/games",
  "/api/weapons", // Publik (jika ada)
  "/api/servers", // Publik (jika ada)
  "/api/characters",
  "/api/accounts",
];

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  SUPER_ADMIN: [
    //"/dashboard",
    "/dashboard/users",
    "/dashboard/finance",
    "/dashboard/transactions",
    "/dashboard/overview",
    "/dashboard/game",
    "/dashboard/character",
    "/dashboard/weapon",
    "/dashboard/server",
    "/dashboard/payment-methods",
    "/dashboard/topup-packages",
    "/dashboard/topup-requests",
    "/dashboard/tiers",
    "/dashboard/profile",
    "/dashboard/platform-earnings",
    "/dashboard/pending-balances",
    "/dashboard/withdrawal-requests",
    "/dashboard/platform-settings",
    "/dashboard/activity-logs",
  ],
  SUPPLIER: [
    // "/dashboard",
    "/dashboard/inventory",
    "/dashboard/transactions",
    "/dashboard/overview",
    "/dashboard/extract",
    "/dashboard/topup",
    "/dashboard/profile",
    "/dashboard/sales",
    "/dashboard/pending-earnings",
    "/dashboard/withdrawal",
    "/dashboard/my-activity",
    "/dashboard/extract-history",
    "/dashboard/tracked-accounts",
  ],
  RESELLER: [
    // "/dashboard",
    "/dashboard/extract",
    "/dashboard/extract-history",
    "/dashboard/tracked-accounts",

    "/dashboard/transactions",
    "/dashboard/overview",
    "/dashboard/topup",
    "/dashboard/profile",
    "/dashboard/withdrawal",
    "/dashboard/my-activity",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    publicRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(route + "/") ||
        pathname.startsWith("/api/auth"),
    )
  ) {
    return NextResponse.next();
  }

  // Allow static files and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check authentication for dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req: request });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = token.role as string;
    const allowedRoutes = roleRoutes[userRole] || [];

    // Check if user has access to this route
    const hasAccess = allowedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    );

    if (!hasAccess && pathname !== "/dashboard") {
      // Redirect to their dashboard overview if they don't have access
      return NextResponse.redirect(new URL("/dashboard/overview", request.url));
    }

    return NextResponse.next();
  }

  // Protect API routes (except auth routes)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add user info to headers for API routes
    const response = NextResponse.next();
    response.headers.set("x-user-id", token.id as string);
    response.headers.set("x-user-role", token.role as string);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

//////////////
//baru
///////////

// import { NextRequest, NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";

// // Routes that don't require authentication
// // Pastikan path API publik ada di sini
// const publicRoutes = [
//   "/",
//   "/catalog",
//   "/login",
//   "/api/auth",
//   "/api/games", // Publik
//   "/api/characters", // Publik
//   "/api/weapons", // Publik (jika ada)
//   "/api/servers", // Publik (jika ada)
//   "/api/accounts", // Publik -> INI PENTING
// ];

// // ... (roleRoutes tetap sama) ...
// const roleRoutes: Record<string, string[]> = {
//   SUPER_ADMIN: [
//     "/dashboard",
//     "/dashboard/users",
//     "/dashboard/finance",
//     "/dashboard/transactions",
//     "/dashboard/overview",
//     "/dashboard/game",
//     "/dashboard/character",
//     "/dashboard/weapon",
//     "/dashboard/server",
//     "/dashboard/payment-methods",
//     "/dashboard/topup-packages",
//     "/dashboard/topup-requests",
//     "/dashboard/tiers",
//     "/dashboard/profile",
//     "/dashboard/platform-earnings",
//     "/dashboard/pending-balances",
//     "/dashboard/withdrawal-requests",
//     "/dashboard/platform-settings",
//     "/dashboard/activity-logs",
//   ],
//   SUPPLIER: [
//     "/dashboard",
//     "/dashboard/inventory",
//     "/dashboard/transactions",
//     "/dashboard/overview",
//     "/dashboard/extract",
//     "/dashboard/topup",
//     "/dashboard/profile",
//     "/dashboard/sales",
//     "/dashboard/pending-earnings",
//     "/dashboard/withdrawal",
//     "/dashboard/my-activity",
//   ],
//   RESELLER: [
//     "/dashboard",
//     "/dashboard/extract",
//     "/dashboard/transactions",
//     "/dashboard/overview",
//     "/dashboard/topup",
//     "/dashboard/profile",
//     "/dashboard/withdrawal",
//     "/dashboard/my-activity",
//   ],
// };

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // 1. Allow static files and public assets first (Best Practice)
//   if (
//     pathname.startsWith("/_next") ||
//     pathname.startsWith("/favicon") ||
//     pathname.includes(".") // images, css, js
//   ) {
//     return NextResponse.next();
//   }

//   // 2. Check if it's a PUBLIC ROUTE
//   // Jika ini rute publik, LANGSUNG IZINKAN dan jangan lakukan pengecekan token lagi
//   const isPublicRoute = publicRoutes.some(
//     (route) => pathname === route || pathname.startsWith(route + "/"), // Ini menangani /api/accounts?gameId=... ataupun /catalog/ID
//   );

//   if (isPublicRoute) {
//     return NextResponse.next();
//   }

//   // 3. Check authentication for DASHBOARD routes
//   if (pathname.startsWith("/dashboard")) {
//     const token = await getToken({ req: request });

//     if (!token) {
//       const loginUrl = new URL("/login", request.url);
//       loginUrl.searchParams.set("callbackUrl", pathname);
//       return NextResponse.redirect(loginUrl);
//     }

//     const userRole = token.role as string;
//     const allowedRoutes = roleRoutes[userRole] || [];

//     const hasAccess = allowedRoutes.some(
//       (route) => pathname === route || pathname.startsWith(route + "/"),
//     );

//     if (!hasAccess && pathname !== "/dashboard") {
//       return NextResponse.redirect(new URL("/dashboard/overview", request.url));
//     }

//     return NextResponse.next();
//   }

//   // 4. Protect remaining API routes (Private API routes that are not in publicRoutes)
//   // Blok ini sekarang hanya akan berjalan untuk API yang TIDAK ada di publicRoutes
//   if (pathname.startsWith("/api")) {
//     const token = await getToken({ req: request });

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const response = NextResponse.next();
//     response.headers.set("x-user-id", token.id as string);
//     response.headers.set("x-user-role", token.role as string);
//     return response;
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
// };
