'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Gamepad2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';

export default function PlatformEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['platform-earnings'],
    queryFn: async () => {
      const res = await fetch('/api/platform-earnings');
      return res.json();
    },
    enabled: status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN',
  });

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN')) {
      router.push('/dashboard/overview');
    }
  }, [status, session, router]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!session || session?.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Earnings</h1>
        <p className="text-zinc-400">Revenue from platform fees</p>
      </div>

      {/* Summary Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Platform Revenue</p>
              <p className="text-4xl font-bold text-emerald-400">
                Rp {data?.summary?.totalEarnings?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">From {data?.pagination?.total || 0} transactions</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-600/20">
              <TrendingUp className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : data?.earnings?.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No earnings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Account</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Game</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Buyer</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Fee Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.earnings?.map((earning: any) => (
                    <tr key={earning.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-white">{earning.transaction?.account?.publicId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-zinc-300">{earning.transaction?.account?.game?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-zinc-300">{earning.transaction?.reseller?.name}</p>
                          <p className="text-xs text-zinc-500">{earning.transaction?.reseller?.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-emerald-400">Rp {earning.amount.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-zinc-400 text-sm">{formatDate(earning.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
