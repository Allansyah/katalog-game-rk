'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, Users, Package, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FinancePage() {
  // Fetch finance stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['finance-stats'],
    queryFn: async () => {
      const res = await fetch('/api/finance/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Finance Overview</h1>
        <p className="text-zinc-400">Platform financial statistics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-white">
                  Rp {(stats?.totalVolume || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-600/20">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Top-ups</p>
                <p className="text-2xl font-bold text-white">
                  Rp {(stats?.totalTopups || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-600/20">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">{stats?.activeUsers || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-600/20">
                <Users className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Sales</p>
                <p className="text-2xl font-bold text-white">{stats?.totalSales || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-600/20">
                <Package className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Financial Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity: { id: string; type: string; amount: number; description: string | null; createdAt: string; user?: { name: string } }) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'TOPUP' ? 'bg-emerald-600/20' :
                      activity.type === 'EARNING' ? 'bg-blue-600/20' : 'bg-red-600/20'
                    }`}>
                      <TrendingUp className={`h-4 w-4 ${
                        activity.type === 'TOPUP' ? 'text-emerald-400' :
                        activity.type === 'EARNING' ? 'text-blue-400' : 'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-white">{activity.description || activity.type}</p>
                      <p className="text-xs text-zinc-500">
                        {activity.user?.name} • {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    activity.type === 'DEDUCTION' ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {activity.type === 'DEDUCTION' ? '-' : '+'}Rp {Math.abs(activity.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
