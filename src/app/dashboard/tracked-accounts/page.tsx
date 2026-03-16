'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Eye, 
  Trash2, 
  Loader2, 
  Search, 
  Plus, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface TrackedAccount {
  id: string;
  accountId: string;
  publicId: string;
  trackedAt: string;
  game: { id: string; name: string; code: string };
  server: { id: string; name: string } | null;
  level: number | null;
  diamond: number;
  basePrice: number;
  status: 'AVAILABLE' | 'LOCKED' | 'SOLD';
  characters: { id: string; name: string; rarity?: number }[];
  weapons: { id: string; name: string; rarity?: number }[];
  transaction: {
    id: string;
    soldAt: string;
    buyer: string;
  } | null;
}

export default function TrackedAccountsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addAccountId, setAddAccountId] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch tracked accounts
  const { data, isLoading, refetch, isRefetching } = useQuery<{ trackedAccounts: TrackedAccount[] }>({
    queryKey: ['tracked-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/tracked-accounts');
      if (!res.ok) throw new Error('Failed to fetch tracked accounts');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Remove tracking mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tracked-accounts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove tracking');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-accounts'] });
      toast.success('Account removed from tracking');
    },
    onError: () => {
      toast.error('Failed to remove tracking');
    },
  });

  // Add tracking mutation
  const addMutation = useMutation({
    mutationFn: async (publicId: string) => {
      const res = await fetch('/api/tracked-accounts/by-public-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add tracking');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tracked-accounts'] });
      toast.success(`Account ${data.trackedAccount.publicId} added to tracking`);
      setAddAccountId('');
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Bulk remove mutation
  const bulkRemoveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => 
        fetch(`/api/tracked-accounts/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      return { count: ids.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tracked-accounts'] });
      setSelectedIds(new Set());
      toast.success(`${data.count} accounts removed from tracking`);
    },
    onError: () => {
      toast.error('Failed to remove some accounts');
    },
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data?.trackedAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data?.trackedAccounts.map(a => a.id) || []));
    }
  };

  const handleAddAccount = () => {
    if (!addAccountId.trim()) {
      toast.error('Please enter an Account ID');
      return;
    }
    addMutation.mutate(addAccountId.trim());
  };

  const handleBulkRemove = () => {
    if (selectedIds.size === 0) {
      toast.error('No accounts selected');
      return;
    }
    bulkRemoveMutation.mutate([...selectedIds]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Available</Badge>;
      case 'LOCKED':
        return <Badge className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Locked</Badge>;
      case 'SOLD':
        return <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" />Sold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const trackedAccounts = data?.trackedAccounts || [];

  // Count by status
  const availableCount = trackedAccounts.filter(a => a.status === 'AVAILABLE').length;
  const soldCount = trackedAccounts.filter(a => a.status === 'SOLD').length;
  const lockedCount = trackedAccounts.filter(a => a.status === 'LOCKED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Tracked Accounts</h1>
          <p className="text-zinc-400">Monitor accounts to check if they are sold</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-zinc-700 text-zinc-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{trackedAccounts.length}</div>
            <div className="text-sm text-zinc-400">Total Tracked</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-400">{availableCount}</div>
            <div className="text-sm text-zinc-400">Available</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{soldCount}</div>
            <div className="text-sm text-zinc-400">Sold</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-400">{lockedCount}</div>
            <div className="text-sm text-zinc-400">Locked</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">{selectedIds.size} account(s) selected</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="border-zinc-700 text-zinc-300"
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkRemove}
                  disabled={bulkRemoveMutation.isPending}
                >
                  {bulkRemoveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Remove Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracked Accounts List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Your Tracked Accounts</CardTitle>
            {trackedAccounts.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.size === trackedAccounts.length && trackedAccounts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm text-zinc-400 cursor-pointer">
                  Select All
                </label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : trackedAccounts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">No accounts tracked yet</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account to Track
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {trackedAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    account.status === 'SOLD'
                      ? 'bg-red-900/10 border-red-900/30'
                      : account.status === 'LOCKED'
                      ? 'bg-yellow-900/10 border-yellow-900/30'
                      : 'bg-zinc-800/50 border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedIds.has(account.id)}
                      onCheckedChange={() => toggleSelect(account.id)}
                      className="mt-1"
                    />

                    {/* Account Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-white font-medium">{account.publicId}</span>
                        {getStatusBadge(account.status)}
                        <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                          {account.game.name}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500">Level:</span>
                          <span className="text-zinc-300 ml-1">{account.level || '-'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Diamond:</span>
                          <span className="text-emerald-400 ml-1">{account.diamond.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Server:</span>
                          <span className="text-zinc-300 ml-1">{account.server?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Price:</span>
                          <span className="text-zinc-300 ml-1">Rp {account.basePrice.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Characters */}
                      {account.characters.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-zinc-500">Characters: </span>
                          <span className="text-xs text-zinc-400">
                            {account.characters.map(c => c.name).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Sold Info */}
                      {account.status === 'SOLD' && account.transaction && (
                        <div className="mt-3 p-2 bg-red-900/20 rounded text-sm">
                          <p className="text-red-400">
                            <span className="text-zinc-400">Sold to: </span>
                            {account.transaction.buyer}
                          </p>
                          <p className="text-zinc-500 text-xs">
                            {new Date(account.transaction.soldAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/extract?accountId=${account.publicId}`)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMutation.mutate(account.id)}
                        disabled={removeMutation.isPending}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Account to Track</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter the Account ID (public ID) to track its status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Enter Account ID (e.g., WW-1704708578-X29F)"
                value={addAccountId}
                onChange={(e) => setAddAccountId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
                className="bg-zinc-800 border-zinc-700 pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 border-zinc-700 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAccount}
                disabled={addMutation.isPending || !addAccountId.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {addMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add to Track
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
