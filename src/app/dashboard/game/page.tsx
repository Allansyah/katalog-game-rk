"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Gamepad2,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Game {
  id: string;
  name: string;
  code: string;
  icon: string | null;
  status: boolean;
  _count?: { characters: number; accounts: number };
  createdAt: string;
}

export default function GameManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    status: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isIconRemoved, setIsIconRemoved] = useState(false); // Flag untuk hapus icon

  const { data: games, isLoading } = useQuery({
    queryKey: ["admin-games", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/games?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("code", formData.code);
      payload.append("status", String(formData.status));

      if (selectedFile) {
        payload.append("icon", selectedFile);
      }

      // Jika user klik hapus icon, kirim flag
      if (isIconRemoved) {
        payload.append("removeIcon", "true");
      }

      const isEdit = !!editingGame;
      const url = isEdit ? `/api/games/${editingGame.id}` : "/api/games";

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: payload,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save game");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(
        editingGame ? "Game updated successfully" : "Game created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete game");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Game deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openModal = (game?: Game) => {
    if (game) {
      setEditingGame(game);
      setFormData({
        name: game.name,
        code: game.code,
        status: game.status,
      });
      if (game.icon) {
        setPreviewUrl(game.icon);
        setIsIconRemoved(false);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setEditingGame(null);
      setFormData({ name: "", code: "", status: true });
      setPreviewUrl(null);
      setSelectedFile(null);
      setIsIconRemoved(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGame(null);
    setFormData({ name: "", code: "", status: true });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsIconRemoved(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setIsIconRemoved(false); // Ada file baru, berarti tidak menghapus
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsIconRemoved(true); // Tandai untuk dihapus di backend
    const fileInput = document.getElementById(
      "icon-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Game Management
          </h1>
          <p className="text-zinc-400">
            Manage supported games in the marketplace
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Game
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search games..."
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
                    <TableHead className="text-zinc-400">Game</TableHead>
                    <TableHead className="text-zinc-400">Code</TableHead>
                    <TableHead className="text-zinc-400">Characters</TableHead>
                    <TableHead className="text-zinc-400">Accounts</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games?.games?.map((game: Game) => (
                    <TableRow
                      key={game.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center overflow-hidden relative shrink-0">
                            {game.icon ? (
                              <img
                                src={game.icon}
                                alt={game.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-xs">
                                {game.code}
                              </span>
                            )}
                          </div>
                          <span className="text-white font-medium">
                            {game.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {game.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-1">
                          <Gamepad2 className="h-4 w-4 text-yellow-400" />
                          {game._count?.characters || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-1">
                          <Gamepad2 className="h-4 w-4 text-emerald-400" />
                          {game._count?.accounts || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            game.status
                              ? "bg-emerald-600/20 text-emerald-400"
                              : "bg-red-600/20 text-red-400"
                          }
                        >
                          {game.status ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(game)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(game.id)}
                            disabled={(game._count?.accounts || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {games?.games?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-zinc-500 py-8"
                      >
                        No games found
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
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingGame ? "Edit Game" : "Add New Game"}
            </DialogTitle>
            <DialogDescription>
              {editingGame
                ? "Update game details"
                : "Add a new game to the marketplace"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Game Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g., Wuthering Waves"
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Game Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g., WW"
                className="bg-zinc-800 border-zinc-700 uppercase"
                maxLength={5}
                required
              />
              <p className="text-xs text-zinc-500">
                Short code for account IDs (max 5 characters)
              </p>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label className="text-zinc-400">Game Icon</Label>

              {previewUrl ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="icon-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-500 transition-colors bg-zinc-800/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-zinc-500" />
                    <p className="mb-2 text-sm text-zinc-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-zinc-500">PNG, JPG or WEBP</p>
                  </div>
                  <input
                    id="icon-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-zinc-400">Active Status</Label>
              <Switch
                checked={formData.status}
                onCheckedChange={(checked) =>
                  setFormData((p) => ({ ...p, status: checked }))
                }
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingGame ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
