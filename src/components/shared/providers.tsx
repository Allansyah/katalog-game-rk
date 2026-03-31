// "use client";

// import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ThemeProvider } from "next-themes";
// import { Toaster } from "@/components/ui/sonner";
// import { BalanceProvider } from "@/contexts/BalanceContext"; // ✅ AKTIFKAN

// // import { BalanceProvider } from "@/contexts/BalanceContext"; // ← Tambah ini

// import { useState } from "react";

// export function Providers({ children }: { children: React.ReactNode }) {
//   const [queryClient] = useState(
//     () =>
//       new QueryClient({
//         defaultOptions: {
//           queries: {
//             staleTime: 60 * 1000, // 1 minute
//             refetchOnWindowFocus: false,
//           },
//         },
//       }),
//   );

//   return (
//     <NextAuthSessionProvider>
//       <QueryClientProvider client={queryClient}>
//         <ThemeProvider
//           attribute="class"
//           defaultTheme="dark"
//           enableSystem
//           disableTransitionOnChange
//         >
//           {children}
//           <Toaster position="top-right" richColors />
//         </ThemeProvider>
//       </QueryClientProvider>
//     </NextAuthSessionProvider>
//   );
// }

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { BalanceProvider } from "@/contexts/BalanceContext"; // ✅ AKTIFKAN

import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <NextAuthSessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <BalanceProvider>
            {" "}
            {/* 🔥 INI FIX UTAMA */}
            {children}
          </BalanceProvider>

          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </QueryClientProvider>
    </NextAuthSessionProvider>
  );
}
