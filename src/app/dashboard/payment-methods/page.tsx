'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Loader2, CreditCard, Wallet } from 'lucide-react';
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
  DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  accountNo: string | null;
  accountName: string | null;
  imageUrl: string | null;
  instructions: string | null;
  status: boolean;
}

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK_TRANSFER',
    accountNo: '',
    accountName: '',
    imageUrl: '',
    instructions: '',
    status: true,
  });

  // Fetch payment methods
  const { data: methods, isLoading } = useQuery({
    queryKey: ['payment-methods', search],
    queryFn: async () => {
      const res = await fetch('/api/payment-methods');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const isEdit = !!editingMethod;
      const res = await fetch('/api/payment-methods', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...data, id: editingMethod.id } : data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingMethod ? 'Payment method updated' : 'Payment method created');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openModal = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        type: method.type,
        accountNo: method.accountNo || '',
        accountName: method.accountName || '',
        imageUrl: method.imageUrl || '',
        instructions: method.instructions || '',
        status: method.status,
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        type: 'BANK_TRANSFER',
        accountNo: '',
        accountName: '',
        imageUrl: '',
        instructions: '',
        status: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      BANK_TRANSFER: 'bg-blue-600/20 text-blue-400',
      E_WALLET: 'bg-purple-600/20 text-purple-400',
      QRIS: 'bg-green-600/20 text-green-400',
    };
    return (
      <Badge className={colors[type] || 'bg-zinc-600/20 text-zinc-400'}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredMethods = methods?.methods?.filter((m: PaymentMethod) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Payment Methods</h1>
          <p className="text-zinc-400">Manage payment methods for top-up</p>
        </div>
        <Button onClick={() => openModal()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Method
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search payment methods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-800 border-zinc-700 pl-10"
            />
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
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Type</TableHead>
                    <TableHead className="text-zinc-400">Account No</TableHead>
                    <TableHead className="text-zinc-400">Account Name</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMethods?.map((method: PaymentMethod) => (
                    <TableRow key={method.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                            {method.type === 'E_WALLET' ? (
                              <Wallet className="h-5 w-5 text-purple-400" />
                            ) : (
                              <CreditCard className="h-5 w-5 text-blue-400" />
                            )}
                          </div>
                          <span className="text-white font-medium">{method.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(method.type)}</TableCell>
                      <TableCell className="text-white font-mono">{method.accountNo || '-'}</TableCell>
                      <TableCell className="text-white">{method.accountName || '-'}</TableCell>
                      <TableCell>
                        <Badge className={method.status ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'}>
                          {method.status ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openModal(method)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMethods?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                        No payment methods found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., BCA, GoPay, OVO"
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Account No</Label>
                <Input
                  value={formData.accountNo}
                  onChange={(e) => setFormData((p) => ({ ...p, accountNo: e.target.value }))}
                  placeholder="1234567890"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Account Name</Label>
                <Input
                  value={formData.accountName}
                  onChange={(e) => setFormData((p) => ({ ...p, accountName: e.target.value }))}
                  placeholder="John Doe"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
                placeholder="Payment instructions..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-zinc-400">Active</Label>
              <Switch
                checked={formData.status}
                onCheckedChange={(c) => setFormData((p) => ({ ...p, status: c }))}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
