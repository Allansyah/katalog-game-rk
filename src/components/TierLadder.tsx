"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Lock, Trophy, Star, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils"; // Pastikan util ini ada atau gunakan className biasa

interface Tier {
  id: string;
  name: string;
  minTotalSales: number;
  discountPercent: number;
  color: string | null;
}

export function TierLadder() {
  const { data, isLoading } = useQuery({
    queryKey: ["ladder-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/ladder");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (isLoading) return <div className="p-4">Loading Ladder...</div>;

  const { ladder, leaderboard } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* --- KOLOM KIRI: VISUAL TANGGA (TIER PROGRESS) --- */}
      <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Tier Progression
            </CardTitle>
            <Badge
              variant="outline"
              className="text-yellow-400 border-yellow-500/30"
            >
              Current: {ladder.currentTier?.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Visual Tangga Vertikal */}
            <div className="flex-1">
              <div className="relative pl-4 border-l-2 border-zinc-800 space-y-0 py-2">
                {ladder.allTiers.map((tier: Tier, index: number) => {
                  const isCurrent = tier.id === ladder.currentTier?.id;
                  const isLocked =
                    tier.minTotalSales >
                    (ladder.currentTier?.minTotalSales || 0) + 0.01; // Simple check
                  const isPast =
                    tier.minTotalSales <
                    (ladder.currentTier?.minTotalSales || 0);

                  return (
                    <div key={tier.id} className="relative pb-8 last:pb-0">
                      {/* Node (Bulatannya) */}
                      <div
                        className={cn(
                          "absolute -left-[21px] top-1 h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                          isLocked
                            ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                            : isPast
                            ? "bg-emerald-900/20 border-emerald-500 text-emerald-500"
                            : "bg-zinc-900 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                        )}
                      >
                        {isPast && <Check className="h-5 w-5" />}
                        {isCurrent && (
                          <Star className="h-5 w-5 animate-pulse" />
                        )}
                        {isLocked && <Lock className="h-5 w-5" />}
                      </div>

                      {/* Label Tier */}
                      <div
                        className={cn(
                          "ml-6 p-3 rounded-lg transition-colors",
                          isCurrent
                            ? "bg-zinc-800/50 border border-zinc-700"
                            : "opacity-60"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4
                            className={cn(
                              "font-bold text-sm",
                              isCurrent ? "text-white" : "text-zinc-400"
                            )}
                          >
                            {tier.name}
                          </h4>
                          {isCurrent && (
                            <Badge className="bg-yellow-500/20 text-yellow-500 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">
                            {tier.discountPercent}% Discount
                          </span>
                          <span
                            className={
                              isCurrent ? "text-white" : "text-zinc-600"
                            }
                          >
                            Min. Rp {tier.minTotalSales.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel Detail Progress (Kanan Visual Tangga) */}
            <div className="w-full md:w-1/3 flex flex-col justify-center">
              <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 text-center">
                <h3 className="text-zinc-400 text-sm mb-2">
                  Progress to Next Tier
                </h3>

                {ladder.nextTier ? (
                  <>
                    <div className="text-3xl font-bold text-white mb-1">
                      {ladder.progressPercent}%
                    </div>
                    <Progress
                      value={parseFloat(ladder.progressPercent)}
                      className="h-2 mb-4 bg-zinc-700"
                    />

                    <div className="space-y-2 text-left">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Next Tier:</span>
                        <span className="text-white font-medium">
                          {ladder.nextTier.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Need to Spend:</span>
                        <span className="text-emerald-400 font-bold">
                          Rp {ladder.remainingAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-4">
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                    <h4 className="text-white font-bold">Max Level Reached!</h4>
                    <p className="text-zinc-500 text-sm">
                      You are at the highest tier.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- KOLOM KANAN: LEADERBOARD (TANGGA PERINGKAT) --- */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((user: any, index: number) => {
              const isTop3 = index < 3;
              const rankColor =
                index === 0
                  ? "text-yellow-500"
                  : index === 1
                  ? "text-gray-300"
                  : index === 2
                  ? "text-amber-700"
                  : "text-zinc-500";

              return (
                <div key={user.id} className="flex items-center gap-3">
                  {/* Rank Number */}
                  <div
                    className={cn(
                      "font-bold text-lg w-6 text-center",
                      rankColor
                    )}
                  >
                    {index + 1}
                  </div>

                  {/* Avatar/Name */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate max-w-[100px]">
                        {user.name}
                      </p>
                      {isTop3 && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1 border-zinc-700 text-zinc-400"
                      >
                        {user.tier?.name || "Supplier"}
                      </Badge>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      Rp{" "}
                      {(
                        user.totalSpent ||
                        user.salesBalance ||
                        0
                      ).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {user.totalSpent ? "Spent" : "Balance"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
