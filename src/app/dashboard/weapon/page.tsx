'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Loader2, Star, Filter, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';

interface Weapon {
  id: string;
  name: string;
  gameId: string;
  game: { id: string; name: string; code: string };
  imageUrl: string | null;
  rarity: number | null;
  weaponType: string | null;
  element: string | null;
  _count?: { accounts: number };
}

interface Game {
  id: string;
  name: string;
  code: string;
}

const WEAPON_TYPES = [
  'Sword',
  'Claymore',
  'Polearm',
  'Bow',
  'Catalyst',
  'Gauntlet',
  'Gun',
  'Rifle',
  'Sniper',
  'SMG',
  'Shotgun',
  'Spear',
  'Axe',
  'Dagger',
  'Wand',
  'Other',
];

export default function WeaponManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState<Weapon | null>(null);
  const [formData, setFormData] = useState({
    gameId: '',
    name: '',
    imageUrl: '',
    rarity: '',
    weaponType: '',
    element: '',
  });

  // Fetch games for dropdown
  const { data: gamesData } = useQuery<{ games: Game[] }>({
    queryKey: ['games'],
    queryFn: () => fetch('/api/games').then((res) => res.json()),
  });

  // Fetch weapons
  const { data: weapons, isLoading } = useQuery({
    queryKey: ['admin-weapons', search, gameFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (gameFilter !== 'all') params.set('gameId', gameFilter);
      const res = await fetch(`/api/weapons?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch weapons');
      return res.json();
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const isEdit = !!editingWeapon;
      const res = await fetch('/api/weapons', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...data, id: editingWeapon.id } : data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save weapon');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingWeapon ? 'Weapon updated successfully' : 'Weapon created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-weapons'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/weapons/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete weapon');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Weapon deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-weapons'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openModal = (weapon?: Weapon) => {
    if (weapon) {
      setEditingWeapon(weapon);
      setFormData({
        gameId: weapon.gameId,
        name: weapon.name,
        imageUrl: weapon.imageUrl || '',
        rarity: weapon.rarity?.toString() || '',
        weaponType: weapon.weaponType || '',
        element: weapon.element || '',
      });
    } else {
      setEditingWeapon(null);
      setFormData({
        gameId: gameFilter !== 'all' ? gameFilter : '',
        name: '',
        imageUrl: '',
        rarity: '',
        weaponType: '',
        element: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWeapon(null);
    setFormData({
      gameId: '',
      name: '',
      imageUrl: '',
      rarity: '',
      weaponType: '',
      element: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getRarityColor = (rarity: number | null) => {
    if (rarity === 5) return 'text-yellow-400';
    if (rarity === 4) return 'text-purple-400';
    if (rarity === 3) return 'text-blue-400';
    return 'text-zinc-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Weapon Management</h1>
          <p className="text-zinc-400">Manage weapons for each game</p>
        </div>
        <Button
          onClick={() => openModal()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Weapon
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search weapons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-800 border-zinc-700 pl-10"
              />
            </div>
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-full md:w-48 bg-zinc-800 border-zinc-700">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by game" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Games</SelectItem>
                {gamesData?.games?.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
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
                    <TableHead className="text-zinc-400">Weapon</TableHead>
                    <TableHead className="text-zinc-400">Game</TableHead>
                    <TableHead className="text-zinc-400">Rarity</TableHead>
                    <TableHead className="text-zinc-400">Type</TableHead>
                    <TableHead className="text-zinc-400">Element</TableHead>
                    <TableHead className="text-zinc-400">In Accounts</TableHead>
                    <TableHead className="text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weapons?.weapons?.map((weapon: Weapon & { _count?: { accounts: number } }) => (
                    <TableRow key={weapon.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white">
                            <Sword className="h-5 w-5" />
                          </div>
                          <span className="text-white font-medium">{weapon.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-700">
                          {weapon.game.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {weapon.rarity ? (
                          <div className={`flex items-center gap-1 ${getRarityColor(weapon.rarity)}`}>
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-semibold">{weapon.rarity}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-white">
                        {weapon.weaponType || '-'}
                      </TableCell>
                      <TableCell className="text-white">
                        {weapon.element || '-'}
                      </TableCell>
                      <TableCell className="text-white">
                        {weapon._count?.accounts || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(weapon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(weapon.id)}
                            disabled={(weapon._count?.accounts || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {weapons?.weapons?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                        No weapons found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingWeapon ? 'Edit Weapon' : 'Add New Weapon'}
            </DialogTitle>
            <DialogDescription>
              {editingWeapon ? 'Update weapon details' : 'Add a new weapon to a game'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Game *</Label>
              <Select
                value={formData.gameId}
                onValueChange={(value) => setFormData((p) => ({ ...p, gameId: value }))}
                disabled={!!editingWeapon}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {gamesData?.games?.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Weapon Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Mistsplitter Reforged"
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Rarity</Label>
                <Select
                  value={formData.rarity}
                  onValueChange={(value) => setFormData((p) => ({ ...p, rarity: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="5">5 Star</SelectItem>
                    <SelectItem value="4">4 Star</SelectItem>
                    <SelectItem value="3">3 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Weapon Type</Label>
                <Select
                  value={formData.weaponType}
                  onValueChange={(value) => setFormData((p) => ({ ...p, weaponType: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {WEAPON_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Element</Label>
                <Input
                  value={formData.element}
                  onChange={(e) => setFormData((p) => ({ ...p, element: e.target.value }))}
                  placeholder="e.g., Pyro"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Image URL (optional)</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending || !formData.gameId}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingWeapon ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
