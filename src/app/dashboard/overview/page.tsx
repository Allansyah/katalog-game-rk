"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Users,
  Wallet,
  TrendingUp,
  ShoppingCart,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Activity,
  Banknote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Pastikan import Progress dari shadcn
// import { TierLadder } from "@/components/TierLadder";

export default function OverviewPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", role],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="p-8 text-white">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-zinc-400">
            Here is your business overview for today.
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-zinc-800 text-zinc-300 border-zinc-700 px-4 py-2"
        >
          {role} Dashboard
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === "RESELLER" && (
          <>
            <StatCard
              title="Available Balance"
              value={`Rp ${(stats?.balance || 0).toLocaleString()}`}
              icon={Wallet}
              color="emerald"
            />
            <StatCard
              title="Pending Withdrawals"
              value={stats?.pendingWithdrawals || 0}
              icon={Clock}
              color="yellow"
              subtitle="Requests awaiting approval"
            />
            <StatCard
              title="Total Purchases"
              value={stats?.totalPurchases || 0}
              icon={ShoppingCart}
              color="blue"
            />
            <StatCard
              title="Total Spent"
              value={`Rp ${(stats?.totalSpent || 0).toLocaleString()}`}
              icon={TrendingUp}
              color="purple"
            />
          </>
        )}

        {role === "SUPPLIER" && (
          <>
            <StatCard
              title="Sales Balance"
              value={`Rp ${(stats?.salesBalance || 0).toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              subtitle="Ready to withdraw"
            />
            <StatCard
              title="Pending Earnings"
              value={`Rp ${(stats?.pendingEarnings || 0).toLocaleString()}`}
              icon={Clock}
              color="yellow"
              subtitle="Waiting 7-day release"
            />
            <StatCard
              title="Available Accounts"
              value={stats?.availableAccounts || 0}
              icon={Package}
              color="blue"
              subtitle={`Total: ${stats?.totalAccounts || 0}`}
            />
            <StatCard
              title="Sold Accounts"
              value={stats?.soldAccounts || 0}
              icon={CheckCircle2}
              color="purple"
            />
          </>
        )}

        {role === "SUPER_ADMIN" && (
          <>
            <StatCard
              title="Platform Earnings"
              value={`Rp ${(stats?.platformEarnings || 0).toLocaleString()}`}
              icon={Banknote}
              color="emerald"
            />
            <StatCard
              title="Pending Topups"
              value={`Rp ${(stats?.pendingTopups || 0).toLocaleString()}`}
              icon={Wallet}
              color="yellow"
              subtitle={`${
                stats?.pendingWithdrawalsCount || 0
              } withdrawals pending`}
            />
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={Users}
              color="blue"
              subtitle={`${stats?.bannedUsers || 0} banned`}
            />
            <StatCard
              title="Total Accounts"
              value={stats?.totalAccounts || 0}
              icon={Package}
              color="purple"
            />
          </>
        )}
      </div>

      {/* Detailed Analysis Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <Card className="bg-zinc-900 border-zinc-800 col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.map((activity: any, i: number) => (
                  <div
                    key={activity.id || i}
                    className="flex items-start gap-3 pb-3 border-b border-zinc-800 last:border-0 last:pb-0"
                  >
                    <div className={`mt-1 p-2 rounded-full bg-zinc-800`}>
                      {/* Simple icon logic based on action could go here */}
                      <Activity className="h-3 w-3 text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-zinc-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 py-0"
                        >
                          {activity.type.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-center py-8 text-sm">
                  No recent activity recorded.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Specific Info Cards */}
        {role === "RESELLER" && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Membership Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Current Tier</span>
                <Badge className="bg-gradient-to-r from-yellow-600 to-amber-500 text-white border-0 px-3 py-1 text-sm">
                  {session?.user?.tierName || "Bronze"}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Discount Rate</span>
                  <span className="text-white font-bold">
                    {session?.user?.discountPercent || 0}%
                  </span>
                </div>
                <Progress
                  value={session?.user?.discountPercent || 0}
                  className="h-2"
                />
                <p className="text-xs text-zinc-500 text-right">
                  Save more on every purchase
                </p>
              </div>

              {stats?.pendingWithdrawals > 0 && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-900/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-500 font-medium">
                      Withdrawal Pending
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      You have {stats.pendingWithdrawals} request(s) awaiting
                      admin approval.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {role === "SUPPLIER" && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Inventory & Sales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Inventory Breakdown */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-300">
                  Inventory Status
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400">Available</span>
                    <span className="text-zinc-300">
                      {stats?.availableAccounts} items
                    </span>
                  </div>
                  <Progress
                    value={
                      (stats?.availableAccounts / stats?.totalAccounts) * 100 ||
                      0
                    }
                    className="h-1.5 bg-emerald-900/30"
                  />

                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-yellow-400">Sold</span>
                    <span className="text-zinc-300">
                      {stats?.soldAccounts} items
                    </span>
                  </div>
                  <Progress
                    value={
                      (stats?.soldAccounts / stats?.totalAccounts) * 100 || 0
                    }
                    className="h-1.5 bg-yellow-900/30"
                  />

                  {stats?.lockedAccounts > 0 && (
                    <>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-red-400">Locked</span>
                        <span className="text-zinc-300">
                          {stats?.lockedAccounts} items
                        </span>
                      </div>
                      <Progress
                        value={
                          (stats?.lockedAccounts / stats?.totalAccounts) *
                            100 || 0
                        }
                        className="h-1.5 bg-red-900/30"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Financials */}
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">
                    Total Inventory Value
                  </span>
                  <span className="text-lg font-bold text-white">
                    Rp {(stats?.totalValue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-zinc-700 my-2" />
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">
                      Pending Release (7 Days)
                    </p>
                    <p className="text-sm font-semibold text-yellow-500">
                      Rp {(stats?.pendingEarnings || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {role === "SUPER_ADMIN" && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Platform Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500">Total Suppliers</p>
                  <p className="text-xl font-bold text-white">
                    {stats?.totalSuppliers}
                  </p>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500">Total Resellers</p>
                  <p className="text-xl font-bold text-white">
                    {stats?.totalResellers}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-300">
                  Financial Overview
                </p>

                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-sm text-zinc-400">Platform Volume</span>
                  <span className="text-sm font-medium text-white">
                    Rp {(stats?.platformVolume || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-sm text-zinc-400">Pending Topups</span>
                  <span className="text-sm font-medium text-yellow-500">
                    Rp {(stats?.pendingTopups || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-400">
                    Platform Earnings
                  </span>
                  <span className="text-sm font-medium text-emerald-500">
                    Rp {(stats?.platformEarnings || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {stats?.pendingWithdrawalsCount > 0 && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-900/30 rounded-lg flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <p className="text-xs text-yellow-200">
                    {stats.pendingWithdrawalsCount} withdrawal requests need
                    attention.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "emerald" | "yellow" | "blue" | "purple";
  subtitle?: string;
}) {
  const colorClasses = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-zinc-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-2 leading-tight">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
