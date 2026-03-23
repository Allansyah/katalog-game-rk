'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Loader2, Star, Filter } from 'lucide-react';
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

interface Character {
  id: string;
  name: string;
  gameId: string;
  game: { id: string; name: string; code: string };
  imageUrl: string | null;
  rarity: number | null;
  element: string | null;
  _count?: { accounts: number };
}

interface Game {
  id: string;
  name: string;
  code: string;
}

export default function CharacterManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [formData, setFormData] = useState({
    gameId: '',
    name: '',
    imageUrl: '',
    rarity: '',
    element: '',
  });

  // Fetch games for dropdown
  const { data: gamesData, isLoading: gamesLoading } = useQuery<{ games: Game[] }>({
    queryKey: ['games'],
    queryFn: () => fetch('/api/games').then((res) => res.json()),
  });

  // Fetch characters
  const { data: characters, isLoading, error } = useQuery({
    queryKey: ['admin-characters', search, gameFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (gameFilter !== 'all') params.set('gameId', gameFilter);
      const res = await fetch(`/api/characters?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch characters');
      }
      return res.json();
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const isEdit = !!editingCharacter;
      const res = await fetch('/api/characters', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...data, id: editingCharacter.id } : data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save character');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingCharacter ? 'Character updated successfully' : 'Character created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-characters'] });
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
      const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete character');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Character deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-characters'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openModal = (character?: Character) => {
    if (character) {
      setEditingCharacter(character);
      setFormData({
        gameId: character.gameId,
        name: character.name,
        imageUrl: character.imageUrl || '',
        rarity: character.rarity?.toString() || '',
        element: character.element || '',
      });
    } else {
      setEditingCharacter(null);
      setFormData({
        gameId: gameFilter !== 'all' ? gameFilter : '',
        name: '',
        imageUrl: '',
        rarity: '',
        element: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCharacter(null);
    setFormData({
      gameId: '',
      name: '',
      imageUrl: '',
      rarity: '',
      element: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gameId) {
      toast.error('Please select a game');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Character name is required');
      return;
    }
    saveMutation.mutate(formData);
  };

  const getRarityColor = (rarity: number | null) => {
    if (rarity === 5) return 'text-yellow-400';
    if (rarity === 4) return 'text-purple-400';
    if (rarity === 3) return 'text-blue-400';
    if (rarity === 2) return 'text-green-400';
    if (rarity === 1) return 'text-zinc-400';
    return 'text-zinc-400';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error loading characters: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Character Management</h1>
          <p className="text-zinc-400">Manage characters for each game</p>
        </div>
        <Button
          onClick={() => openModal()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Character
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search characters..."
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
                    <TableHead className="text-zinc-400">Character</TableHead>
                    <TableHead className="text-zinc-400">Game</TableHead>
                    <TableHead className="text-zinc-400">Rarity</TableHead>
                    <TableHead className="text-zinc-400">Element</TableHead>
                    <TableHead className="text-zinc-400">In Accounts</TableHead>
                    <TableHead className="text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters?.characters?.map((char: Character & { _count?: { accounts: number } }) => (
                    <TableRow key={char.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                            {char.name.charAt(0)}
                          </div>
                          <span className="text-white font-medium">{char.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-700">
                          {char.game.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {char.rarity ? (
                          <div className={`flex items-center gap-1 ${getRarityColor(char.rarity)}`}>
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-semibold">{char.rarity}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-white">
                        {char.element || '-'}
                      </TableCell>
                      <TableCell className="text-white">
                        {char._count?.accounts || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(char)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(char.id)}
                            disabled={(char._count?.accounts || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {characters?.characters?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                        No characters found
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
              {editingCharacter ? 'Edit Character' : 'Add New Character'}
            </DialogTitle>
            <DialogDescription>
              {editingCharacter ? 'Update character details' : 'Add a new character to a game'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Game *</Label>
              <Select
                value={formData.gameId}
                onValueChange={(value) => setFormData((p) => ({ ...p, gameId: value }))}
                disabled={!!editingCharacter}
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
              <Label className="text-zinc-400">Character Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Jinhsi"
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Rarity</Label>
                <Select
                  value={formData.rarity}
                  onValueChange={(value) => setFormData((p) => ({ ...p, rarity: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select rarity" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="5">5 Star</SelectItem>
                    <SelectItem value="4">4 Star</SelectItem>
                    <SelectItem value="3">3 Star</SelectItem>
                    <SelectItem value="2">2 Star</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Element</Label>
                <Input
                  value={formData.element}
                  onChange={(e) => setFormData((p) => ({ ...p, element: e.target.value }))}
                  placeholder="e.g., Spectro"
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
                  editingCharacter ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}