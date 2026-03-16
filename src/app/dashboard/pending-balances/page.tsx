'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  DollarSign,
  CheckCircle,
  Gamepad2,
  Loader2,
  User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect } from 'react';

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDaysRemaining = (releaseDate: string | Date) => {
  const now = new Date();
  const release = new Date(releaseDate);
  const diffTime = release.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

function PendingTable({ data, isLoading }: { data: any; isLoading: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Supplier</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Account</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Game</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Amount</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Days Left</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Release Date</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="text-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
              </td>
            </tr>
          ) : data?.pendingBalances?.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-zinc-400">
                No pending balances
              </td>
            </tr>
          ) : (
            data?.pendingBalances?.map((pb: any) => (
              <tr key={pb.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-zinc-300">{pb.user?.name}</p>
                      <p className="text-xs text-zinc-500">{pb.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-white">{pb.transaction?.account?.publicId}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-zinc-300">{pb.transaction?.account?.game?.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-amber-400">Rp {pb.amount.toLocaleString()}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge className="bg-amber-600/20 text-amber-400">
                    {getDaysRemaining(pb.releaseDate)} days
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-zinc-400">{formatDate(pb.releaseDate)}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReleasedTable({ data, isLoading }: { data: any; isLoading: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Supplier</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Account</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Game</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Amount</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Released At</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="text-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
              </td>
            </tr>
          ) : data?.pendingBalances?.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-10 text-zinc-400">
                No released balances yet
              </td>
            </tr>
          ) : (
            data?.pendingBalances?.map((pb: any) => (
              <tr key={pb.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-zinc-300">{pb.user?.name}</p>
                      <p className="text-xs text-zinc-500">{pb.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-white">{pb.transaction?.account?.publicId}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-zinc-300">{pb.transaction?.account?.game?.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-emerald-400">Rp {pb.amount.toLocaleString()}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-zinc-400">{formatDate(pb.releasedAt || pb.createdAt)}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function PendingBalancesAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-balances-admin', 'PENDING'],
    queryFn: async () => {
      const res = await fetch('/api/pending-balances?status=PENDING');
      return res.json();
    },
    enabled: status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN',
  });

  const { data: releasedData, isLoading: releasedLoading } = useQuery({
    queryKey: ['pending-balances-admin', 'RELEASED'],
    queryFn: async () => {
      const res = await fetch('/api/pending-balances?status=RELEASED');
      return res.json();
    },
    enabled: status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN',
  });

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN')) {
      router.push('/dashboard/overview');
    }
  }, [status, session, router]);

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
        <h1 className="text-2xl font-bold text-white">Pending Balances</h1>
        <p className="text-zinc-400">Manage supplier pending earnings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-600/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Total Pending</p>
                <p className="text-xl font-bold text-white">
                  Rp {pendingData?.summary?.totalPending?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-600/20">
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Pending Count</p>
                <p className="text-xl font-bold text-white">
                  {pendingData?.summary?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Total Released</p>
                <p className="text-xl font-bold text-white">
                  {releasedData?.pagination?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <Tabs defaultValue="pending">
            <div className="border-b border-zinc-800 px-6 pt-4">
              <TabsList className="bg-zinc-800">
                <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600">
                  <Clock className="w-4 h-4 mr-2" /> Pending
                </TabsTrigger>
                <TabsTrigger value="released" className="data-[state=active]:bg-emerald-600">
                  <CheckCircle className="w-4 h-4 mr-2" /> Released
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="pending" className="p-6 pt-4">
              <PendingTable data={pendingData} isLoading={pendingLoading} />
            </TabsContent>
            <TabsContent value="released" className="p-6 pt-4">
              <ReleasedTable data={releasedData} isLoading={releasedLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
