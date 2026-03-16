'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface TopupPackage {
  id: string;
  amount: number;
  bonus: number;
  description: string | null;
  isActive: boolean;
}

export default function TopupPackagesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<TopupPackage | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    bonus: '0',
    description: '',
    isActive: true,
  });

  // Fetch packages
  const { data: packages, isLoading } = useQuery({
    queryKey: ['topup-packages'],
    queryFn: async () => {
      const res = await fetch('/api/topup-packages');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const isEdit = !!editingPkg;
      const res = await fetch('/api/topup-packages', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...data, id: editingPkg.id } : data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingPkg ? 'Package updated' : 'Package created');
      queryClient.invalidateQueries({ queryKey: ['topup-packages'] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/topup-packages?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Package deleted');
      queryClient.invalidateQueries({ queryKey: ['topup-packages'] });
    },
  });

  const openModal = (pkg?: TopupPackage) => {
    if (pkg) {
      setEditingPkg(pkg);
      setFormData({
        amount: pkg.amount.toString(),
        bonus: pkg.bonus.toString(),
        description: pkg.description || '',
        isActive: pkg.isActive,
      });
    } else {
      setEditingPkg(null);
      setFormData({ amount: '', bonus: '0', description: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPkg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Top-up Packages</h1>
          <p className="text-zinc-400">Manage top-up denominations</p>
        </div>
        <Button onClick={() => openModal()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {packages?.packages?.map((pkg: TopupPackage) => (
            <Card
              key={pkg.id}
              className={`bg-zinc-900 border-zinc-800 hover:border-emerald-600/50 transition-colors ${
                !pkg.isActive ? 'opacity-50' : ''
              }`}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  Rp {pkg.amount.toLocaleString()}
                </div>
                {pkg.bonus > 0 && (
                  <Badge className="bg-emerald-600/20 text-emerald-400 mb-2">
                    <Gift className="h-3 w-3 mr-1" />
                    +Rp {pkg.bonus.toLocaleString()} Bonus
                  </Badge>
                )}
                {pkg.description && (
                  <p className="text-xs text-zinc-500 mb-2">{pkg.description}</p>
                )}
                <Badge className={pkg.isActive ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'}>
                  {pkg.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <div className="flex justify-center gap-2 mt-3">
                  <Button variant="ghost" size="sm" onClick={() => openModal(pkg)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(pkg.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {packages?.packages?.length === 0 && (
            <div className="col-span-full text-center text-zinc-500 py-12">
              No packages found. Create one to get started.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingPkg ? 'Edit Package' : 'Add Package'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Amount (Rp) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                placeholder="10000"
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Bonus (Rp)</Label>
              <Input
                type="number"
                value={formData.bonus}
                onChange={(e) => setFormData((p) => ({ ...p, bonus: e.target.value }))}
                placeholder="0"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Special promotion"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-zinc-400">Active</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(c) => setFormData((p) => ({ ...p, isActive: c }))}
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
