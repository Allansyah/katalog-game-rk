'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';

interface Transaction {
  id: string;
  account?: {
    publicId: string;
    game: { name: string };
  };
  finalPrice: number;
  createdAt: string;
  reseller?: { name: string };
}

interface BalanceLog {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
  user?: { name: string };
}

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', search, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
  });

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      TOPUP: { bg: 'bg-emerald-600/20', text: 'text-emerald-400', icon: ArrowUpRight },
      DEDUCTION: { bg: 'bg-red-600/20', text: 'text-red-400', icon: ArrowDownRight },
      EARNING: { bg: 'bg-blue-600/20', text: 'text-blue-400', icon: ArrowUpRight },
    };
    const v = variants[type] || variants.TOPUP;
    const Icon = v.icon;
    return (
      <Badge className={`${v.bg} ${v.text} border-0 gap-1`}>
        <Icon className="h-3 w-3" />
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Transactions</h1>
        <p className="text-zinc-400">
          {session?.user?.role === 'SUPER_ADMIN' 
            ? 'View all platform transactions'
            : 'Your transaction history'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-white">
                  {transactions?.stats?.total || 0}
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
                <p className="text-zinc-400 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-white">
                  Rp {(transactions?.stats?.volume || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-600/20">
                <ArrowUpRight className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {transactions?.stats?.thisMonth || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-600/20">
                <ArrowDownRight className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-800 border-zinc-700 pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableHead className="text-zinc-400">Date</TableHead>
                    <TableHead className="text-zinc-400">Type</TableHead>
                    <TableHead className="text-zinc-400">Description</TableHead>
                    <TableHead className="text-zinc-400">Amount</TableHead>
                    {session?.user?.role === 'SUPER_ADMIN' && (
                      <TableHead className="text-zinc-400">User</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.transactions?.map((tx: BalanceLog) => (
                    <TableRow key={tx.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="text-white">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getTypeBadge(tx.type)}</TableCell>
                      <TableCell className="text-white">
                        {tx.description || '-'}
                      </TableCell>
                      <TableCell className={`font-semibold ${
                        tx.type === 'DEDUCTION' ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {tx.type === 'DEDUCTION' ? '-' : '+'}Rp {Math.abs(tx.amount).toLocaleString()}
                      </TableCell>
                      {session?.user?.role === 'SUPER_ADMIN' && (
                        <TableCell className="text-white">
                          {tx.user?.name || '-'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {transactions?.transactions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={session?.user?.role === 'SUPER_ADMIN' ? 5 : 4} className="text-center text-zinc-500 py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
