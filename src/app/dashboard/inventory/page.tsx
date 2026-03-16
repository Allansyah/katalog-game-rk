'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
import { toast } from 'sonner';

type AccountStatus = 'AVAILABLE' | 'LOCKED' | 'SOLD';

interface Server {
  id: string;
  name: string;
  code: string | null;
  status: boolean;
}

interface Character {
  id: string;
  name: string;
  rarity: number | null;
  element: string | null;
  imageUrl: string | null;
}

interface Weapon {
  id: string;
  name: string;
  rarity: number | null;
  weaponType: string | null;
  imageUrl: string | null;
}

interface Game {
  id: string;
  name: string;
  code: string;
  characters: Character[];
  weapons: Weapon[];
  servers: Server[];
}

interface Account {
  id: string;
  publicId: string;
  game: { id: string; name: string; code: string };
  level: number | null;
  diamond: number;
  serverId: string | null;
  server: { id: string; name: string; code: string | null } | null;
  gender: string | null;
  status: AccountStatus;
  basePrice: number;
  characters: { id: string; name: string; rarity: number | null }[];
  weapons: { id: string; name: string; rarity: number | null }[];
  createdAt: string;
}

interface FormData {
  gameId: string;
  level: string;
  diamond: string;
  serverId: string;
  gender: string;
  characterIds: string[];
  weaponIds: string[];
  basePrice: string;
  // Credentials - Required
  username: string;
  password: string;
  // Credentials - Email
  email: string;
  emailPassword: string;
  // Credentials - Security
  secretQuestion: string;
  secretAnswer: string;
  // Credentials - Personal
  firstName: string;
  lastName: string;
  accountCountry: string;
  dateOfBirth: string;
  // Credentials - Notes
  additionalNote: string;
}

const initialFormData: FormData = {
  gameId: '',
  level: '',
  diamond: '0',
  serverId: '',
  gender: '',
  characterIds: [],
  weaponIds: [],
  basePrice: '',
  username: '',
  password: '',
  email: '',
  emailPassword: '',
  secretQuestion: '',
  secretAnswer: '',
  firstName: '',
  lastName: '',
  accountCountry: '',
  dateOfBirth: '',
  additionalNote: '',
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Fetch accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['supplier-accounts', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('supplierOnly', 'true');
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const res = await fetch(`/api/accounts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
  });

  // Fetch games with relations for form
  const { data: gamesData } = useQuery({
    queryKey: ['games-with-relations'],
    queryFn: async () => {
      const res = await fetch('/api/games?includeRelations=true');
      if (!res.ok) throw new Error('Failed to fetch games');
      return res.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['supplier-accounts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusBadge = (status: AccountStatus) => {
    const variants: Record<AccountStatus, { bg: string; text: string }> = {
      AVAILABLE: { bg: 'bg-emerald-600/20', text: 'text-emerald-400' },
      LOCKED: { bg: 'bg-yellow-600/20', text: 'text-yellow-400' },
      SOLD: { bg: 'bg-red-600/20', text: 'text-red-400' },
    };
    const v = variants[status];
    return (
      <Badge className={`${v.bg} ${v.text} border-0`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Inventory</h1>
          <p className="text-zinc-400">Manage your game accounts</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search by Public ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-800 border-zinc-700 pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
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
                    <TableHead className="text-zinc-400">Public ID</TableHead>
                    <TableHead className="text-zinc-400">Game</TableHead>
                    <TableHead className="text-zinc-400">Level</TableHead>
                    <TableHead className="text-zinc-400">Diamond</TableHead>
                    <TableHead className="text-zinc-400">Server</TableHead>
                    <TableHead className="text-zinc-400">Price</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts?.accounts?.map((account: Account) => (
                    <TableRow key={account.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-mono text-white">{account.publicId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-700">
                          {account.game.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{account.level || '-'}</TableCell>
                      <TableCell className="text-emerald-400">{account.diamond.toLocaleString()}</TableCell>
                      <TableCell className="text-white">{account.server?.name || '-'}</TableCell>
                      <TableCell className="text-white">Rp {account.basePrice.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(account.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAccount(account)}
                            disabled={account.status !== 'AVAILABLE'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(account.id)}
                            disabled={account.status !== 'AVAILABLE'}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {accounts?.accounts?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-zinc-500 py-8">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Account Modal */}
      <AccountFormModal
        open={isAddModalOpen || !!editingAccount}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAccount(null);
        }}
        account={editingAccount}
        games={gamesData?.games || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['supplier-accounts'] });
          setIsAddModalOpen(false);
          setEditingAccount(null);
        }}
      />
    </div>
  );
}

function AccountFormModal({
  open,
  onClose,
  account,
  games,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  games: Game[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (account) {
        setFormData({
          ...initialFormData,
          gameId: account.game.id,
          level: account.level?.toString() || '',
          diamond: account.diamond.toString(),
          serverId: account.serverId || '',
          gender: account.gender || '',
          characterIds: account.characters.map(c => c.id),
          weaponIds: account.weapons.map(w => w.id),
          basePrice: account.basePrice.toString(),
        });
      } else {
        setFormData(initialFormData);
      }
      setShowOptionalFields(false);
    }
  }, [open, account]);

  const selectedGame = games.find((g) => g.id === formData.gameId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        gameId: formData.gameId,
        level: formData.level ? parseInt(formData.level) : null,
        diamond: parseInt(formData.diamond) || 0,
        serverId: formData.serverId || null,
        gender: formData.gender || null,
        characterIds: formData.characterIds,
        weaponIds: formData.weaponIds,
        basePrice: parseFloat(formData.basePrice),
        credentials: {
          // Required
          username: formData.username,
          password: formData.password || undefined,
          // Email
          email: formData.email || undefined,
          emailPassword: formData.emailPassword || undefined,
          // Security
          secretQuestion: formData.secretQuestion || undefined,
          secretAnswer: formData.secretAnswer || undefined,
          // Personal
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          accountCountry: formData.accountCountry || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          // Notes
          additionalNote: formData.additionalNote || undefined,
        },
      };

      const url = account ? `/api/accounts/${account.id}` : '/api/accounts';
      const method = account ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save account');
      }

      toast.success(account ? 'Account updated successfully' : 'Account created successfully');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterToggle = (charId: string) => {
    setFormData((prev) => ({
      ...prev,
      characterIds: prev.characterIds.includes(charId)
        ? prev.characterIds.filter((id) => id !== charId)
        : [...prev.characterIds, charId],
    }));
  };

  const handleWeaponToggle = (weaponId: string) => {
    setFormData((prev) => ({
      ...prev,
      weaponIds: prev.weaponIds.includes(weaponId)
        ? prev.weaponIds.filter((id) => id !== weaponId)
        : [...prev.weaponIds, weaponId],
    }));
  };

  // Reset selections when game changes
  const handleGameChange = (gameId: string) => {
    setFormData((prev) => ({
      ...prev,
      gameId,
      characterIds: [],
      weaponIds: [],
      serverId: '',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {account ? 'Edit Account' : 'Add New Account'}
          </DialogTitle>
          <DialogDescription>
            {account ? 'Update account details' : 'Add a new game account to your inventory'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Selection */}
          <div className="space-y-2">
            <Label className="text-zinc-400">Game *</Label>
            <Select
              value={formData.gameId}
              onValueChange={handleGameChange}
              disabled={!!account}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select game" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name} ({game.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Server Selection */}
          {selectedGame && selectedGame.servers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-zinc-400">Server</Label>
              <Select
                value={formData.serverId}
                onValueChange={(value) => setFormData((p) => ({ ...p, serverId: value }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select server" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {selectedGame.servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name} {server.code ? `(${server.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Characters */}
          {selectedGame && selectedGame.characters.length > 0 && (
            <div className="space-y-2">
              <Label className="text-zinc-400">Characters (Select all that the account has)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                {selectedGame.characters.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleCharacterToggle(char.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-left ${
                      formData.characterIds.includes(char.id)
                        ? 'bg-emerald-600/20 border border-emerald-600'
                        : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      char.rarity === 5 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      char.rarity === 4 ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                      'bg-gradient-to-br from-blue-500 to-cyan-600'
                    }`}>
                      {char.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{char.name}</div>
                      {char.rarity && (
                        <div className="text-xs text-zinc-500">★{char.rarity}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-xs text-zinc-500">
                Selected: {formData.characterIds.length} character(s)
              </div>
            </div>
          )}

          {/* Weapons */}
          {selectedGame && selectedGame.weapons.length > 0 && (
            <div className="space-y-2">
              <Label className="text-zinc-400">Weapons (Select all that the account has)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                {selectedGame.weapons.map((weapon) => (
                  <button
                    key={weapon.id}
                    type="button"
                    onClick={() => handleWeaponToggle(weapon.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-left ${
                      formData.weaponIds.includes(weapon.id)
                        ? 'bg-amber-600/20 border border-amber-600'
                        : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      weapon.rarity === 5 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      weapon.rarity === 4 ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                      'bg-gradient-to-br from-blue-500 to-cyan-600'
                    }`}>
                      {weapon.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{weapon.name}</div>
                      {weapon.rarity && (
                        <div className="text-xs text-zinc-500">★{weapon.rarity}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-xs text-zinc-500">
                Selected: {formData.weaponIds.length} weapon(s)
              </div>
            </div>
          )}

          {/* Level & Diamond */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Level</Label>
              <Input
                type="number"
                value={formData.level}
                onChange={(e) => setFormData((p) => ({ ...p, level: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Diamond</Label>
              <Input
                type="number"
                value={formData.diamond}
                onChange={(e) => setFormData((p) => ({ ...p, diamond: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-zinc-400">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData((p) => ({ ...p, gender: value }))}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Base Price */}
          <div className="space-y-2">
            <Label className="text-zinc-400">Base Price (Rp) *</Label>
            <Input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData((p) => ({ ...p, basePrice: e.target.value }))}
              className="bg-zinc-800 border-zinc-700"
              required
            />
          </div>

          {/* Credentials Section */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h4 className="text-white font-medium">Login Credentials {!account && '*'}</h4>
            
            {/* Required Credentials */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Username {!account && '*'}</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  required={!account}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Password {!account && '*'}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  required={!account}
                  placeholder={account ? 'Leave empty to keep current' : ''}
                />
              </div>
            </div>

            {/* Email Credentials */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Email Password</Label>
                <Input
                  type="password"
                  value={formData.emailPassword}
                  onChange={(e) => setFormData((p) => ({ ...p, emailPassword: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="Email password"
                />
              </div>
            </div>

            {/* Toggle Optional Fields */}
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {showOptionalFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showOptionalFields ? 'Hide' : 'Show'} optional fields
            </button>

            {/* Optional Fields */}
            {showOptionalFields && (
              <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg">
                {/* Security Questions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Secret Question</Label>
                    <Input
                      value={formData.secretQuestion}
                      onChange={(e) => setFormData((p) => ({ ...p, secretQuestion: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="e.g., What is your pet's name?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Secret Answer</Label>
                    <Input
                      value={formData.secretAnswer}
                      onChange={(e) => setFormData((p) => ({ ...p, secretAnswer: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="Answer to secret question"
                    />
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="First name on account"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="Last name on account"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Account Country</Label>
                    <Input
                      value={formData.accountCountry}
                      onChange={(e) => setFormData((p) => ({ ...p, accountCountry: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="e.g., Indonesia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Date of Birth</Label>
                    <Input
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="e.g., 1990-01-15"
                    />
                  </div>
                </div>

                {/* Additional Note */}
                <div className="space-y-2">
                  <Label className="text-zinc-400">Additional Note</Label>
                  <Textarea
                    value={formData.additionalNote}
                    onChange={(e) => setFormData((p) => ({ ...p, additionalNote: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 min-h-[80px]"
                    placeholder="Any additional information about this account..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                account ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
