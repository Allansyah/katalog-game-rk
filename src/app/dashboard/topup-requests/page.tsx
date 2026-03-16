'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TopupRequestStatus } from '@prisma/client';

interface TopupRequest {
  id: string;
  amount: number;
  status: TopupRequestStatus;
  proofUrl: string | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
  user: { id: string; name: string; email: string; role: string };
  paymentMethod: { id: string; name: string; type: string };
}

export default function TopupRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  const [processModal, setProcessModal] = useState<TopupRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['topup-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/topup-requests?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  // Process mutation
  const processMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const res = await fetch('/api/topup-requests/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, adminNotes }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to process');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Request processed successfully');
      queryClient.invalidateQueries({ queryKey: ['topup-requests'] });
      setProcessModal(null);
      setAdminNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusBadge = (status: TopupRequestStatus) => {
    const configs: Record<TopupRequestStatus, { bg: string; text: string; icon: React.ElementType }> = {
      PENDING: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', icon: Clock },
      APPROVED: { bg: 'bg-emerald-600/20', text: 'text-emerald-400', icon: CheckCircle },
      REJECTED: { bg: 'bg-red-600/20', text: 'text-red-400', icon: XCircle },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.bg} ${config.text} gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredRequests = requests?.requests?.filter((r: TopupRequest) =>
    r.user.name.toLowerCase().includes(search.toLowerCase()) ||
    r.user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const pendingCount = requests?.requests?.filter((r: TopupRequest) => r.status === 'PENDING').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Top-up Requests</h1>
        <p className="text-zinc-400">Approve or reject top-up requests from suppliers/resellers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
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
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-800 border-zinc-700 pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead className="text-zinc-400">User</TableHead>
                    <TableHead className="text-zinc-400">Amount</TableHead>
                    <TableHead className="text-zinc-400">Method</TableHead>
                    <TableHead className="text-zinc-400">Date</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests?.map((req: TopupRequest) => (
                    <TableRow key={req.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{req.user.name}</p>
                          <p className="text-xs text-zinc-500">{req.user.email}</p>
                          <Badge variant="outline" className="text-xs mt-1">{req.user.role}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-400 font-semibold">
                        Rp {req.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-white">{req.paymentMethod.name}</TableCell>
                      <TableCell className="text-zinc-400 text-sm">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>
                        {req.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setProcessModal(req)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Process
                            </Button>
                          </div>
                        )}
                        {req.status !== 'PENDING' && (
                          <span className="text-zinc-500 text-sm">
                            {req.adminNotes || '-'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRequests?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                        No requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Modal */}
      <Dialog open={!!processModal} onOpenChange={() => setProcessModal(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Process Top-up Request</DialogTitle>
          </DialogHeader>
          {processModal && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">User:</span>
                  <span className="text-white">{processModal.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="text-emerald-400 font-bold">
                    Rp {processModal.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Method:</span>
                  <span className="text-white">{processModal.paymentMethod.name}</span>
                </div>
                {processModal.notes && (
                  <div className="pt-2 border-t border-zinc-700">
                    <span className="text-zinc-400 text-sm">Notes: </span>
                    <span className="text-white text-sm">{processModal.notes}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Admin Notes (optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes (e.g., rejection reason)"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setProcessModal(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => processMutation.mutate({ id: processModal.id, action: 'reject' })}
                  disabled={processMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {processMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => processMutation.mutate({ id: processModal.id, action: 'approve' })}
                  disabled={processMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {processMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
