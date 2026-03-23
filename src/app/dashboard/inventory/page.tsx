"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Upload,
  Download,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Papa from "papaparse";

type AccountStatus = "AVAILABLE" | "LOCKED" | "SOLD";

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
  characters: {
    id: string;
    name: string;
    rarity: number | null;
    quantity: number;
  }[];
  weapons: {
    id: string;
    name: string;
    rarity: number | null;
    quantity: number;
  }[];
  createdAt: string;
}

interface CharacterSelection {
  characterId: string;
  quantity: number;
}

interface WeaponSelection {
  weaponId: string;
  quantity: number;
}

interface FormData {
  gameId: string;
  level: string;
  diamond: string;
  serverId: string;
  gender: string;
  characterSelections: CharacterSelection[];
  weaponSelections: WeaponSelection[];
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
  gameId: "",
  level: "",
  diamond: "0",
  serverId: "",
  gender: "",
  characterSelections: [],
  weaponSelections: [],
  basePrice: "",
  username: "",
  password: "",
  email: "",
  emailPassword: "",
  secretQuestion: "",
  secretAnswer: "",
  firstName: "",
  lastName: "",
  accountCountry: "",
  dateOfBirth: "",
  additionalNote: "",
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Fetch accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["supplier-accounts", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("supplierOnly", "true");
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/accounts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });

  // Fetch games with relations for form
  const { data: gamesData } = useQuery({
    queryKey: ["games-with-relations"],
    queryFn: async () => {
      const res = await fetch("/api/games?includeRelations=true");
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Account deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["supplier-accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusBadge = (status: AccountStatus) => {
    const variants: Record<AccountStatus, { bg: string; text: string }> = {
      AVAILABLE: { bg: "bg-emerald-600/20", text: "text-emerald-400" },
      LOCKED: { bg: "bg-yellow-600/20", text: "text-yellow-400" },
      SOLD: { bg: "bg-red-600/20", text: "text-red-400" },
    };
    const v = variants[status];
    return <Badge className={`${v.bg} ${v.text} border-0`}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Inventory
          </h1>
          <p className="text-zinc-400">Manage your game accounts</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="outline"
            className="border-zinc-700 hover:bg-zinc-800"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
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
                    <TableRow
                      key={account.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell className="font-mono text-white">
                        {account.publicId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-700">
                          {account.game.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {account.level || "-"}
                      </TableCell>
                      <TableCell className="text-emerald-400">
                        {account.diamond.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-white">
                        {account.server?.name || "-"}
                      </TableCell>
                      <TableCell className="text-white">
                        Rp {account.basePrice.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(account.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAccount(account)}
                            disabled={account.status !== "AVAILABLE"}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(account.id)}
                            disabled={account.status !== "AVAILABLE"}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {accounts?.accounts?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-zinc-500 py-8"
                      >
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
          queryClient.invalidateQueries({ queryKey: ["supplier-accounts"] });
          setIsAddModalOpen(false);
          setEditingAccount(null);
        }}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        games={gamesData?.games || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["supplier-accounts"] });
          setIsImportModalOpen(false);
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
          gameId: account.game.id,
          level: account.level?.toString() || "",
          diamond: account.diamond.toString(),
          serverId: account.serverId || "",
          gender: account.gender || "",
          characterSelections: account.characters.map((c) => ({
            characterId: c.id,
            quantity: c.quantity,
          })),
          weaponSelections: account.weapons.map((w) => ({
            weaponId: w.id,
            quantity: w.quantity,
          })),
          basePrice: account.basePrice.toString(),
          // Credentials tidak diisi karena tidak di-fetch (bisa ditambahkan jika perlu)
          username: "",
          password: "",
          email: "",
          emailPassword: "",
          secretQuestion: "",
          secretAnswer: "",
          firstName: "",
          lastName: "",
          accountCountry: "",
          dateOfBirth: "",
          additionalNote: "",
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
      // Validasi dasar
      if (!formData.gameId) {
        toast.error("Please select a game");
        return;
      }
      if (!formData.basePrice) {
        toast.error("Base price is required");
        return;
      }

      const payload = {
        gameId: formData.gameId,
        level: formData.level ? parseInt(formData.level) : null,
        diamond: parseInt(formData.diamond) || 0,
        serverId: formData.serverId || null,
        gender: formData.gender || null,
        characterSelections: formData.characterSelections.filter(
          (c) => c.quantity > 0
        ),
        weaponSelections: formData.weaponSelections.filter(
          (w) => w.quantity > 0
        ),
        basePrice: parseFloat(formData.basePrice),
        credentials: {
          username: formData.username,
          password: formData.password || undefined,
          email: formData.email || undefined,
          emailPassword: formData.emailPassword || undefined,
          secretQuestion: formData.secretQuestion || undefined,
          secretAnswer: formData.secretAnswer || undefined,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          accountCountry: formData.accountCountry || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          additionalNote: formData.additionalNote || undefined,
        },
      };

      const url = account ? `/api/accounts/${account.id}` : "/api/accounts";
      const method = account ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save account");
      }

      toast.success(
        account
          ? "Account updated successfully"
          : "Account created successfully"
      );
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterChange = (characterId: string, quantity: number) => {
    setFormData((prev) => {
      const existing = prev.characterSelections.find(
        (c) => c.characterId === characterId
      );
      if (quantity <= 0) {
        // Hapus jika quantity 0
        return {
          ...prev,
          characterSelections: prev.characterSelections.filter(
            (c) => c.characterId !== characterId
          ),
        };
      } else if (existing) {
        // Update quantity
        return {
          ...prev,
          characterSelections: prev.characterSelections.map((c) =>
            c.characterId === characterId ? { ...c, quantity } : c
          ),
        };
      } else {
        // Tambah baru
        return {
          ...prev,
          characterSelections: [
            ...prev.characterSelections,
            { characterId, quantity },
          ],
        };
      }
    });
  };

  const handleWeaponChange = (weaponId: string, quantity: number) => {
    setFormData((prev) => {
      const existing = prev.weaponSelections.find(
        (w) => w.weaponId === weaponId
      );
      if (quantity <= 0) {
        return {
          ...prev,
          weaponSelections: prev.weaponSelections.filter(
            (w) => w.weaponId !== weaponId
          ),
        };
      } else if (existing) {
        return {
          ...prev,
          weaponSelections: prev.weaponSelections.map((w) =>
            w.weaponId === weaponId ? { ...w, quantity } : w
          ),
        };
      } else {
        return {
          ...prev,
          weaponSelections: [...prev.weaponSelections, { weaponId, quantity }],
        };
      }
    });
  };

  const getQuantityForCharacter = (characterId: string) => {
    return (
      formData.characterSelections.find((c) => c.characterId === characterId)
        ?.quantity || 0
    );
  };

  const getQuantityForWeapon = (weaponId: string) => {
    return (
      formData.weaponSelections.find((w) => w.weaponId === weaponId)
        ?.quantity || 0
    );
  };

  // Reset selections when game changes
  const handleGameChange = (gameId: string) => {
    setFormData((prev) => ({
      ...prev,
      gameId,
      characterSelections: [],
      weaponSelections: [],
      serverId: "",
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* SOLUSI 4: Struktur modal yang lebih baik dengan flex col dan h-full */}
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-5xl p-0">
        <div className="flex flex-col h-[90vh]">
          {/* Header - Fixed */}
          <DialogHeader className="px-6 py-4 border-b border-zinc-800">
            <DialogTitle className="text-white">
              {account ? "Edit Account" : "Add New Account"}
            </DialogTitle>
            <DialogDescription>
              {account
                ? "Update account details"
                : "Add a new game account to your inventory"}
            </DialogDescription>
          </DialogHeader>

          {/* Form Content - Scrollable */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-4"
          >
            <div className="space-y-4">
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
                    onValueChange={(value) =>
                      setFormData((p) => ({ ...p, serverId: value }))
                    }
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select server" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {selectedGame.servers.map((server) => (
                        <SelectItem key={server.id} value={server.id}>
                          {server.name} {server.code ? `(${server.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Characters - dengan layout 2 kolom untuk nama pendek, 1 kolom untuk nama panjang */}
              {selectedGame && selectedGame.characters.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">
                    Characters (with quantity)
                  </Label>
                  <div className="rounded-lg border border-zinc-800">
                    <div className="max-h-[250px] overflow-y-auto p-2">
                      {/* Flex wrap dengan max-width yang dikontrol */}
                      <div className="flex flex-wrap gap-2">
                        {selectedGame.characters.map((char) => {
                          const qty = getQuantityForCharacter(char.id);
                          // Hitung panjang nama untuk menentukan class
                          const nameLength = char.name.length;

                          return (
                            <div
                              key={char.id}
                              className={`flex items-center gap-2 p-2 rounded-lg transition-colors flex-1 ${
                                nameLength > 10
                                  ? "min-w-[calc(100%-0.5rem)]"
                                  : "min-w-[calc(50%-0.5rem)] max-w-[calc(50%-0.5rem)]"
                              } ${
                                qty > 0
                                  ? "bg-emerald-600/20 border border-emerald-600"
                                  : "bg-zinc-800 border border-zinc-700"
                              }`}
                              style={{
                                flexBasis:
                                  nameLength > 10
                                    ? "100%"
                                    : "calc(50% - 0.5rem)",
                              }}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                                  char.rarity === 5
                                    ? "bg-gradient-to-br from-amber-500 to-orange-600"
                                    : char.rarity === 4
                                    ? "bg-gradient-to-br from-purple-500 to-pink-600"
                                    : "bg-gradient-to-br from-blue-500 to-cyan-600"
                                }`}
                              >
                                {char.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white truncate">
                                  {char.name}
                                </div>
                                {char.rarity && (
                                  <div className="text-xs text-zinc-500">
                                    ★{char.rarity}
                                  </div>
                                )}
                              </div>
                              <Input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) =>
                                  handleCharacterChange(
                                    char.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 h-8 bg-zinc-900 border-zinc-700 text-center shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Weapons - dengan layout yang sama */}
              {selectedGame && selectedGame.weapons.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">
                    Weapons (with quantity)
                  </Label>
                  <div className="rounded-lg border border-zinc-800">
                    <div className="max-h-[250px] overflow-y-auto p-2">
                      <div className="flex flex-wrap gap-2">
                        {selectedGame.weapons.map((weapon) => {
                          const qty = getQuantityForWeapon(weapon.id);
                          const nameLength = weapon.name.length;

                          return (
                            <div
                              key={weapon.id}
                              className={`flex items-center gap-2 p-2 rounded-lg transition-colors flex-1 ${
                                nameLength > 10
                                  ? "min-w-[calc(100%-0.5rem)]"
                                  : "min-w-[calc(50%-0.5rem)] max-w-[calc(50%-0.5rem)]"
                              } ${
                                qty > 0
                                  ? "bg-amber-600/20 border border-amber-600"
                                  : "bg-zinc-800 border border-zinc-700"
                              }`}
                              style={{
                                flexBasis:
                                  nameLength > 10
                                    ? "100%"
                                    : "calc(50% - 0.5rem)",
                              }}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                                  weapon.rarity === 5
                                    ? "bg-gradient-to-br from-amber-500 to-orange-600"
                                    : weapon.rarity === 4
                                    ? "bg-gradient-to-br from-purple-500 to-pink-600"
                                    : "bg-gradient-to-br from-blue-500 to-cyan-600"
                                }`}
                              >
                                {weapon.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white truncate">
                                  {weapon.name}
                                </div>
                                {weapon.rarity && (
                                  <div className="text-xs text-zinc-500">
                                    ★{weapon.rarity}
                                  </div>
                                )}
                              </div>
                              <Input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) =>
                                  handleWeaponChange(
                                    weapon.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 h-8 bg-zinc-900 border-zinc-700 text-center shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, level: e.target.value }))
                    }
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Diamond</Label>
                  <Input
                    type="number"
                    value={formData.diamond}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, diamond: e.target.value }))
                    }
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className="text-zinc-400">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((p) => ({ ...p, gender: value }))
                  }
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
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, basePrice: e.target.value }))
                  }
                  className="bg-zinc-800 border-zinc-700"
                  required
                />
              </div>

              {/* Credentials Section */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h4 className="text-white font-medium">
                  Login Credentials {!account && "*"}
                </h4>

                {/* Required Credentials */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Username</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, username: e.target.value }))
                      }
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="Username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Password</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, password: e.target.value }))
                      }
                      className="bg-zinc-800 border-zinc-700"
                      placeholder={
                        account ? "Leave empty to keep current" : "Password"
                      }
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
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, email: e.target.value }))
                      }
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="Email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Email Password</Label>
                    <Input
                      type="password"
                      value={formData.emailPassword}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          emailPassword: e.target.value,
                        }))
                      }
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
                  {showOptionalFields ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {showOptionalFields ? "Hide" : "Show"} optional fields
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
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              secretQuestion: e.target.value,
                            }))
                          }
                          className="bg-zinc-800 border-zinc-700"
                          placeholder="e.g., What is your pet's name?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Secret Answer</Label>
                        <Input
                          value={formData.secretAnswer}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              secretAnswer: e.target.value,
                            }))
                          }
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
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              firstName: e.target.value,
                            }))
                          }
                          className="bg-zinc-800 border-zinc-700"
                          placeholder="First name on account"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Last Name</Label>
                        <Input
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              lastName: e.target.value,
                            }))
                          }
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
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              accountCountry: e.target.value,
                            }))
                          }
                          className="bg-zinc-800 border-zinc-700"
                          placeholder="e.g., Indonesia"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Date of Birth</Label>
                        <Input
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              dateOfBirth: e.target.value,
                            }))
                          }
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
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            additionalNote: e.target.value,
                          }))
                        }
                        className="bg-zinc-800 border-zinc-700 min-h-[80px]"
                        placeholder="Any additional information about this account..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Actions - Fixed at bottom */}
          <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : account ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportCSVModal({
  open,
  onClose,
  games,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  games: Game[];
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    publicId: "",
    level: "",
    diamond: "",
    server: "",
    gender: "",
    characters: "",
    weapons: "",
    basePrice: "",
    username: "",
    password: "",
    email: "",
    emailPassword: "",
  });
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const selectedGame = games.find((g) => g.id === selectedGameId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewData(results.data.slice(0, 5)); // Preview 5 baris
        setStep("mapping");
      },
      error: (error) => {
        toast.error("Failed to parse CSV: " + error.message);
      },
    });
  };

  const downloadTemplate = () => {
    const headers = [
      "publicId",
      "level",
      "diamond",
      "server",
      "gender",
      "characters",
      "weapons",
      "basePrice",
      "username",
      "password",
      "email",
      "emailPassword",
    ];

    const csvContent = [
      headers.join(","),
      "GI-ABC123,55,5000,America,Male,Jean|1|5,Dull Blade|1|1,250000,user123,pass123,email@example.com,emailpass",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "account_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file || !selectedGameId) {
      toast.error("Please select a game and upload a file");
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const accounts = results.data;
        const success: any[] = [];
        const failed: { row: number; error: string }[] = [];

        // Process each row
        for (let i = 0; i < accounts.length; i++) {
          const row = accounts[i] as any;
          const rowNumber = i + 2; // +2 karena header di baris 1

          try {
            // Parse characters format: "Jean|1|5,Diluc|1|5" (name|quantity|rarity)
            const characters = row[columnMapping.characters]
              ? row[columnMapping.characters].split(",").map((c: string) => {
                  const [name, quantity, rarity] = c.split("|");
                  const character = selectedGame?.characters.find(
                    (ch) => ch.name.toLowerCase() === name.toLowerCase()
                  );
                  return {
                    characterId: character?.id || name,
                    quantity: parseInt(quantity) || 1,
                  };
                })
              : [];

            // Parse weapons format: "Dull Blade|1|1,Skyward Blade|1|5"
            const weapons = row[columnMapping.weapons]
              ? row[columnMapping.weapons].split(",").map((w: string) => {
                  const [name, quantity, rarity] = w.split("|");
                  const weapon = selectedGame?.weapons.find(
                    (wp) => wp.name.toLowerCase() === name.toLowerCase()
                  );
                  return {
                    weaponId: weapon?.id || name,
                    quantity: parseInt(quantity) || 1,
                  };
                })
              : [];

            const payload = {
              gameId: selectedGameId,
              level: parseInt(row[columnMapping.level]) || null,
              diamond: parseInt(row[columnMapping.diamond]) || 0,
              serverId: row[columnMapping.server] || null,
              gender: row[columnMapping.gender]?.toUpperCase() || null,
              characterSelections: characters,
              weaponSelections: weapons,
              basePrice: parseFloat(row[columnMapping.basePrice]) || 0,
              credentials: {
                username: row[columnMapping.username],
                password: row[columnMapping.password],
                email: row[columnMapping.email],
                emailPassword: row[columnMapping.emailPassword],
              },
            };

            // Validate required fields
            if (!payload.credentials.username) {
              throw new Error("Username is required");
            }
            if (!payload.credentials.password) {
              throw new Error("Password is required");
            }
            if (payload.basePrice <= 0) {
              throw new Error("Base price must be greater than 0");
            }

            const res = await fetch("/api/accounts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.error || "Failed to create account");
            }

            success.push(row);
          } catch (error) {
            failed.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        setImportResult({
          success: success.length,
          failed: failed.length,
          errors: failed.map((f) => `Row ${f.row}: ${f.error}`),
        });
        setStep("preview");

        if (failed.length === 0) {
          toast.success(`Successfully imported ${success.length} accounts`);
          onSuccess();
        } else {
          toast.error(
            `Imported ${success.length} accounts, ${failed.length} failed`
          );
        }

        setIsLoading(false);
      },
      error: (error) => {
        toast.error("Failed to parse CSV: " + error.message);
        setIsLoading(false);
      },
    });
  };

  const resetModal = () => {
    setFile(null);
    setSelectedGameId("");
    setPreviewData([]);
    setStep("upload");
    setColumnMapping({
      publicId: "",
      level: "",
      diamond: "",
      server: "",
      gender: "",
      characters: "",
      weapons: "",
      basePrice: "",
      username: "",
      password: "",
      email: "",
      emailPassword: "",
    });
    setImportResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const availableColumns =
    previewData.length > 0 ? Object.keys(previewData[0]) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            Import Accounts from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import game accounts
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            {/* Game Selection */}
            <div className="space-y-2">
              <Label className="text-zinc-400">Select Game *</Label>
              <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Choose a game" />
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

            {/* Template Download */}
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">CSV Template</h4>
                  <p className="text-sm text-zinc-400">
                    Download the template to see the required format
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                  className="border-zinc-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-zinc-400">Upload CSV File *</Label>
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  disabled={!selectedGameId}
                />
                <Label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-zinc-400" />
                  <span className="text-white font-medium">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-sm text-zinc-400">CSV files only</span>
                </Label>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-400 shrink-0" />
                <div className="text-sm text-zinc-300">
                  <p className="font-medium text-blue-400 mb-1">
                    CSV Format Guide:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    <li>publicId: Unique identifier (e.g., GI-ABC123)</li>
                    <li>level: Account level (number)</li>
                    <li>diamond: Diamond amount (number)</li>
                    <li>server: Server name (match with game servers)</li>
                    <li>gender: Male/Female</li>
                    <li>
                      characters: Format: "CharacterName|Quantity|Rarity" (comma
                      separated)
                    </li>
                    <li>
                      weapons: Format: "WeaponName|Quantity|Rarity" (comma
                      separated)
                    </li>
                    <li>basePrice: Price in Rupiah (number)</li>
                    <li>username: Login username (required)</li>
                    <li>password: Login password (required)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setStep("mapping")}
                disabled={!file || !selectedGameId}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Next: Map Columns
              </Button>
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Map CSV Columns</h4>
              <p className="text-sm text-zinc-400 mb-4">
                Match your CSV columns to the required fields
              </p>

              <div className="space-y-3">
                {[
                  { key: "publicId", label: "Public ID", required: true },
                  { key: "level", label: "Level", required: false },
                  { key: "diamond", label: "Diamond", required: false },
                  { key: "server", label: "Server", required: false },
                  { key: "gender", label: "Gender", required: false },
                  { key: "characters", label: "Characters", required: false },
                  { key: "weapons", label: "Weapons", required: false },
                  { key: "basePrice", label: "Base Price", required: true },
                  { key: "username", label: "Username", required: true },
                  { key: "password", label: "Password", required: true },
                  { key: "email", label: "Email", required: false },
                  {
                    key: "emailPassword",
                    label: "Email Password",
                    required: false,
                  },
                ].map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-3 gap-2 items-center"
                  >
                    <Label className="text-zinc-400">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-red-400">*</span>
                      )}
                    </Label>
                    <Select
                      value={columnMapping[field.key]}
                      onValueChange={(value) =>
                        setColumnMapping((prev) => ({
                          ...prev,
                          [field.key]: value,
                        }))
                      }
                    >
                      <SelectTrigger className="col-span-2 bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="">Ignore</SelectItem>
                        {availableColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="bg-zinc-800/50 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Data Preview</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-700">
                        {Object.keys(previewData[0]).map((header) => (
                          <TableHead key={header} className="text-zinc-400">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, idx) => (
                        <TableRow key={idx} className="border-zinc-700">
                          {Object.values(row).map((value: any, cellIdx) => (
                            <TableCell key={cellIdx} className="text-white">
                              {String(value).substring(0, 30)}
                              {String(value).length > 30 && "..."}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("upload")}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import Accounts"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && importResult && (
          <div className="space-y-4">
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Import Results</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-emerald-600/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {importResult.success}
                  </div>
                  <div className="text-sm text-zinc-400">Successful</div>
                </div>
                <div className="bg-red-600/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {importResult.failed}
                  </div>
                  <div className="text-sm text-zinc-400">Failed</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h5 className="text-white font-medium mb-2">Errors:</h5>
                  <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-400 mb-1">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
              {importResult.failed > 0 && (
                <Button
                  type="button"
                  onClick={() => {
                    resetModal();
                    setStep("upload");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
