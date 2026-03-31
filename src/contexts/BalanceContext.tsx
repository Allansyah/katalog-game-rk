"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface BalanceContextType {
  refreshBalance: () => void;
  invalidateBalance: () => void;
}

const BalanceContext = createContext<BalanceContextType | null>(null);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useSession();

  const status = session?.status ?? "unauthenticated"; // ✅ FIX

  const refreshBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["user-balance"] });
  }, [queryClient]);

  const invalidateBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["user-balance"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }, [queryClient]);

  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ tambahan SSR safety

    const handleFocus = () => {
      if (status === "authenticated") {
        refreshBalance();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [status, refreshBalance]);

  return (
    <BalanceContext.Provider value={{ refreshBalance, invalidateBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalanceContext() {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error("useBalanceContext must be used within BalanceProvider");
  }
  return context;
}
