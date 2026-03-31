"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export interface UserBalance {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  salesBalance: number;
  pendingBalance: number;
  tierId: string | null;
  tier: {
    id: string;
    name: string;
    discountPercent: number;
  } | null;
  totalSpent: number;
  isBanned: boolean;
}

export function useUserBalance() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<{ user: UserBalance }>({
    queryKey: ["user-balance"],
    queryFn: async () => {
      const res = await fetch("/api/user/balance");
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    enabled: status === "authenticated",
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const invalidateBalance = () => {
    queryClient.invalidateQueries({ queryKey: ["user-balance"] });
  };

  const refreshBalance = () => {
    refetch();
  };

  return {
    user: data?.user,
    balance: data?.user?.balance ?? session?.user?.balance ?? 0,
    salesBalance: data?.user?.salesBalance ?? session?.user?.salesBalance ?? 0,
    pendingBalance:
      data?.user?.pendingBalance ?? session?.user?.pendingBalance ?? 0,
    isLoading,
    error,
    invalidateBalance,
    refreshBalance,
    isAuthenticated: status === "authenticated",
  };
}
