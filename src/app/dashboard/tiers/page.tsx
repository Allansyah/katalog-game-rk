'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Loader2, Star, Users } from 'lucide-react';
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

interface Tier {
  id: string;
  name: string;
  discountPercent: number;
  minTotalSales: number;
  color: string | null;
  isDefault: boolean;
  _count?: { users: number };
}

const COLOR_PRESETS = [
  { name: 'Bronze', value: '#CD7F32' },
  { name: 'Silver', value: '#C0C0C0' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Platinum', value: '#E5E4E2' },
  { name: 'Emerald', value: '#50C878' },
  { name: 'Sapphire', value: '#0F52BA' },
  { name: 'Ruby', value: '#E0115F' },
  { name: 'Amethyst', value: '#9966CC' },
  { name: 'Diamond', value: '#B9F2FF' },
  { name: 'Obsidian', value: '#1C1C1C' },
];

export default function TiersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    discountPercent: '',
    minTotalSales: '',
    color: '#CD7F32',
    isDefault: false,
  });

  // Fetch tiers
  const { data: tiers, isLoading } = useQuery({
    queryKey: ['tiers'],
    queryFn: async () => {
      const res = await fetch('/api/tiers');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const isEdit = !!editingTier;
      const res = await fetch('/api/tiers', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...data, id: editingTier.id } : data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingTier ? 'Tier updated' : 'Tier created');
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tiers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Tier deleted');
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openModal = (tier?: Tier) => {
    if (tier) {
      setEditingTier(tier);
      setFormData({
        name: tier.name,
        discountPercent: tier.discountPercent.toString(),
        minTotalSales: tier.minTotalSales.toString(),
        color: tier.color || '#CD7F32',
        isDefault: tier.isDefault,
      });
    } else {
      setEditingTier(null);
      setFormData({
        name: '',
        discountPercent: '',
        minTotalSales: '0',
        color: '#CD7F32',
        isDefault: false,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTier(null);
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Reseller Tiers</h1>
          <p className="text-zinc-400">Manage tier levels and discounts for resellers</p>
        </div>
        <Button onClick={() => openModal()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Tier
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div className="text-sm text-zinc-400">
              <p className="font-medium text-white mb-1">How Tiers Work</p>
              <p>Tiers are automatically assigned based on total spending. When a reseller reaches the minimum total sales for a tier, they will be promoted automatically. The default tier is assigned to new resellers.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiers Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tiers?.tiers?.map((tier: Tier) => (
            <Card
              key={tier.id}
              className="bg-zinc-900 border-zinc-800 hover:border-emerald-600/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tier.color || '#CD7F32' }}
                    />
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                  </div>
                  {tier.isDefault && (
                    <Badge className="bg-emerald-600/20 text-emerald-400 text-xs">
                      Default
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Discount</span>
                    <span className="text-emerald-400 font-semibold">{tier.discountPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Min. Sales</span>
                    <span className="text-white">Rp {tier.minTotalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Users</span>
                    <span className="text-white flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {tier._count?.users || 0}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
                  <Button variant="ghost" size="sm" onClick={() => openModal(tier)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this tier?')) {
                        deleteMutation.mutate(tier.id);
                      }
                    }}
                    disabled={(tier._count?.users || 0) > 0 || tier.isDefault}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {tiers?.tiers?.length === 0 && (
            <div className="col-span-full text-center text-zinc-500 py-12">
              No tiers found. Create one to get started.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTier ? 'Edit Tier' : 'Add Tier'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Bronze, Silver, Gold"
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Discount (%) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData((p) => ({ ...p, discountPercent: e.target.value }))}
                  placeholder="5"
                  className="bg-zinc-800 border-zinc-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Min. Sales (Rp) *</Label>
                <Input
                  type="number"
                  value={formData.minTotalSales}
                  onChange={(e) => setFormData((p) => ({ ...p, minTotalSales: e.target.value }))}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, color: color.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      formData.color === color.value ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <Input
                value={formData.color}
                onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                placeholder="#CD7F32"
                className="bg-zinc-800 border-zinc-700 mt-2"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div>
                <Label className="text-white">Default Tier</Label>
                <p className="text-xs text-zinc-500">Assigned to new resellers</p>
              </div>
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(c) => setFormData((p) => ({ ...p, isDefault: c }))}
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
