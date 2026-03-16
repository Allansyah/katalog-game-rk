'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Package, Users, Wallet, TrendingUp, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function OverviewPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  // Fetch stats based on role
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', role],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-zinc-400">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 px-4 py-2"
        >
          {role} Account
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'RESELLER' && (
          <>
            <StatCard
              title="Balance"
              value={`Rp ${(stats?.balance || session?.user ? (session.user as { balance?: number })?.balance : 0)?.toLocaleString()}`}
              icon={Wallet}
              color="emerald"
            />
            <StatCard
              title="Your Tier"
              value={session?.user?.tierName || 'Bronze'}
              icon={TrendingUp}
              color="yellow"
              subtitle={`${session?.user?.discountPercent || 0}% discount`}
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
              icon={ArrowUpRight}
              color="purple"
            />
          </>
        )}

        {role === 'SUPPLIER' && (
          <>
            <StatCard
              title="Total Accounts"
              value={stats?.totalAccounts || 0}
              icon={Package}
              color="emerald"
            />
            <StatCard
              title="Available"
              value={stats?.availableAccounts || 0}
              icon={Package}
              color="blue"
            />
            <StatCard
              title="Sold"
              value={stats?.soldAccounts || 0}
              icon={ShoppingCart}
              color="yellow"
            />
            <StatCard
              title="Earnings"
              value={`Rp ${(stats?.totalEarnings || 0).toLocaleString()}`}
              icon={Wallet}
              color="purple"
            />
          </>
        )}

        {role === 'SUPER_ADMIN' && (
          <>
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={Users}
              color="emerald"
            />
            <StatCard
              title="Suppliers"
              value={stats?.totalSuppliers || 0}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Resellers"
              value={stats?.totalResellers || 0}
              icon={Users}
              color="yellow"
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

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 5).map((activity: { id: string; description: string; createdAt: string; type: string }, i: number) => (
                  <div key={activity.id || i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Tier Info (for Resellers) */}
        {role === 'RESELLER' && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Your Tier Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Current Tier</span>
                  <Badge className="bg-emerald-600">{session?.user?.tierName || 'Bronze'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Discount</span>
                  <span className="text-white font-semibold">{session?.user?.discountPercent || 0}%</span>
                </div>
                <div className="pt-4 border-t border-zinc-800">
                  <p className="text-sm text-zinc-500">
                    Increase your total spending to unlock higher tiers and better discounts!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Stats (for Suppliers) */}
        {role === 'SUPPLIER' && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Available</span>
                  <span className="text-emerald-400 font-semibold">{stats?.availableAccounts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Sold</span>
                  <span className="text-yellow-400 font-semibold">{stats?.soldAccounts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Total Value</span>
                  <span className="text-white font-semibold">
                    Rp {(stats?.totalValue || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Stats (for Super Admin) */}
        {role === 'SUPER_ADMIN' && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Active Games</span>
                  <span className="text-emerald-400 font-semibold">{stats?.activeGames || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Total Transactions</span>
                  <span className="text-yellow-400 font-semibold">{stats?.totalTransactions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Platform Volume</span>
                  <span className="text-white font-semibold">
                    Rp {(stats?.platformVolume || 0).toLocaleString()}
                  </span>
                </div>
              </div>
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
  color: 'emerald' | 'yellow' | 'blue' | 'purple';
  subtitle?: string;
}) {
  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-600/20',
    yellow: 'text-yellow-400 bg-yellow-600/20',
    blue: 'text-blue-400 bg-blue-600/20',
    purple: 'text-purple-400 bg-purple-600/20',
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">{title}</p>
            <p className="text-xl md:text-2xl font-bold text-white mt-1">{value}</p>
            {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
