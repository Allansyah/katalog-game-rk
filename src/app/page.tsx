"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Gamepad2,
  Search,
  Filter,
  LogIn,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Shield,
  Star,
  AlertCircle,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Types Sesuai Prisma Schema ---
interface Game {
  id: string;
  name: string;
  code: string;
  status: boolean;
  _count?: { accounts: number };
}

interface Character {
  id: string;
  name: string;
  rarity: number;
  element?: string | null;
}

interface Server {
  id: string;
  name: string;
  code: string | null;
}

interface Account {
  id: string;
  publicId: string;
  game: { name: string; code: string };
  level: number | null;
  diamond: number;
  server: { id: string; name: string; code: string | null } | null;
  gender: string | null;
  characters: Array<{
    id: string;
    name: string;
    rarity: number;
    element?: string | null;
  }>;
  weapons: Array<{
    id: string;
    name: string;
    rarity: number;
  }>;
  basePrice: number;
  status: string;
  createdAt: string;
}

// --- Navbar Component (Outside main component) ---
function Navbar({ session }: { session: unknown }) {
  const userSession = session as { user?: { name?: string } } | null;

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-600">
            <Gamepad2 className="text-white h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              RIKKASTORE
            </span>
            <p className="text-[10px] text-zinc-500 -mt-0.5">
              Game Account Marketplace
            </p>
          </div>
        </Link>
        <div>
          {userSession ? (
            <Link href="/dashboard/overview">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// --- Footer Component (Outside main component) ---
function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-900 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
        <p>
          © {new Date().getFullYear()} Rikkastore.id - Game Account Marketplace
        </p>
      </div>
    </footer>
  );
}

// --- Account Card Component ---
function AccountCard({
  account,
  onCopy,
}: {
  account: Account;
  onCopy: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyAction = () => {
    onCopy(account.publicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-emerald-500/40 transition-all flex flex-col h-full group">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-emerald-400 border-emerald-500/20"
        >
          {account.publicId}
        </Badge>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 hover:bg-zinc-800"
          onClick={copyAction}
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3 text-zinc-500" />
          )}
        </Button>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-500">
              LV {account.level || 1}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-cyan-500/10 px-2 py-1 rounded-md">
            <Diamond className="h-3.5 w-3.5 text-cyan-500" />
            <span className="text-xs font-bold text-cyan-500">
              {account.diamond.toLocaleString()}
            </span>
          </div>
          {account.server && (
            <Badge
              variant="secondary"
              className="bg-zinc-800 text-zinc-400 text-xs"
            >
              {account.server.name}
            </Badge>
          )}
        </div>

        <div className="space-y-2 mb-4 flex-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
            Featured Characters
          </span>
          <div className="flex flex-wrap gap-1.5">
            {account.characters?.slice(0, 5).map((c, i) => (
              <Badge
                key={i}
                variant="secondary"
                className={cn(
                  "bg-zinc-800 border-none text-[10px] py-0 px-2",
                  c.rarity === 5
                    ? "text-amber-400 bg-amber-400/5"
                    : "text-purple-400 bg-purple-400/5"
                )}
              >
                <Star className="w-2.5 h-2.5 mr-1" />
                {c.name}
              </Badge>
            ))}
            {account.characters?.length > 5 && (
              <Badge
                variant="secondary"
                className="bg-zinc-800 text-zinc-400 text-[10px]"
              >
                +{account.characters.length - 5}
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">
              Harga
            </span>
            <div className="text-lg font-black text-white">
              <span className="text-xs font-normal text-zinc-500 mr-1">Rp</span>
              {account.basePrice.toLocaleString()}
            </div>
          </div>
          <Link href={`/catalog/${account.publicId}`}>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/20"
            >
              Detail
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Landing Page Component ---
export default function LandingPage() {
  const { data: session } = useSession();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    characters: [] as string[],
    minDiamond: 0,
    maxDiamond: 50000,
    minLevel: 1,
    maxLevel: 70,
    serverId: "",
    gender: "",
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch Games
  const { data: gamesData, isLoading: isLoadingGames } = useQuery({
    queryKey: ["games-public"],
    queryFn: async () => {
      const res = await fetch("/api/games");
      const json = await res.json();
      return Array.isArray(json) ? { games: json } : json;
    },
  });

  // Fetch Servers for selected game
  const { data: serversData } = useQuery({
    queryKey: ["servers", selectedGame?.id],
    queryFn: async () => {
      if (!selectedGame) return { servers: [] };
      const res = await fetch(`/api/servers?gameId=${selectedGame.id}`);
      return res.json();
    },
    enabled: !!selectedGame,
  });

  // Fetch Characters for selected game
  const { data: charactersData } = useQuery({
    queryKey: ["characters", selectedGame?.id],
    queryFn: async () => {
      if (!selectedGame) return { characters: [] };
      const res = await fetch(`/api/games/${selectedGame.id}/characters`);
      return res.json();
    },
    enabled: !!selectedGame,
  });

  // Fetch Accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts-public", selectedGame?.id, page, searchQuery, filters],
    queryFn: async () => {
      if (!selectedGame) return { accounts: [], pagination: { totalPages: 0 } };

      const params = new URLSearchParams({
        gameId: selectedGame.id,
        page: page.toString(),
        limit: "20",
      });

      if (searchQuery) params.set("search", searchQuery);
      if (filters.serverId) params.set("serverId", filters.serverId);
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.minDiamond > 0)
        params.set("minDiamond", filters.minDiamond.toString());
      if (filters.maxDiamond < 50000)
        params.set("maxDiamond", filters.maxDiamond.toString());
      if (filters.minLevel > 1)
        params.set("minLevel", filters.minLevel.toString());
      if (filters.maxLevel < 70)
        params.set("maxLevel", filters.maxLevel.toString());
      if (filters.characters.length > 0)
        params.set("characters", filters.characters.join(","));

      const res = await fetch(`/api/accounts?${params}`);
      return res.json();
    },
    enabled: !!selectedGame,
  });

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    toast.success("ID Berhasil disalin!", { description: `Account ID: ${id}` });
  };

  // VIEW 1: PILIH GAME
  if (!selectedGame) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar session={session} />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3"
            >
              Pilih Game
            </motion.h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Selamat datang di Rikkastore. Silakan pilih game untuk melihat
              katalog akun yang tersedia.
            </p>
          </div>

          {isLoadingGames ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-emerald-500 h-8 w-8" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {gamesData?.games
                ?.filter((g: Game) => g.status)
                .map((game: Game, index: number) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-all cursor-pointer group overflow-hidden"
                      onClick={() => {
                        setSelectedGame(game);
                        setFilters({
                          characters: [],
                          minDiamond: 0,
                          maxDiamond: 50000,
                          minLevel: 1,
                          maxLevel: 70,
                          serverId: "",
                          gender: "",
                        });
                        setSearchQuery("");
                        setPage(1);
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="bg-emerald-500/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/20 transition-colors">
                          <span className="text-2xl font-black text-emerald-500">
                            {game.code}
                          </span>
                        </div>
                        <h3 className="font-bold text-zinc-100">{game.name}</h3>
                        <Badge
                          variant="secondary"
                          className="mt-2 bg-zinc-800 text-zinc-400 border-none"
                        >
                          {game._count?.accounts || 0} Akun
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}

          {!isLoadingGames &&
            gamesData?.games?.filter((g: Game) => g.status).length === 0 && (
              <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
                <AlertCircle className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-white font-medium">
                  Tidak ada game tersedia
                </h3>
                <p className="text-zinc-500 text-sm mt-1">
                  Game akan ditambahkan segera.
                </p>
              </div>
            )}
        </main>
        <Footer />
      </div>
    );
  }

  // VIEW 2: KATALOG (SETELAH PILIH GAME)
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar session={session} />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGame(null)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedGame.name}
                </h2>
                <p className="text-sm text-zinc-500">
                  Menampilkan akun {selectedGame.name} yang tersedia
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Cari ID Akun..."
                  className="pl-10 bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "border-zinc-800 text-zinc-300",
                  showFilters &&
                    "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                )}
              >
                <Filter className="h-4 w-4 mr-2" /> Filter
                {filters.characters.length > 0 && (
                  <Badge className="ml-2 bg-emerald-600 text-white text-xs">
                    {filters.characters.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-5 space-y-5">
                    {/* Character Filter */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300 text-sm">
                        Karakter (pilih yang diinginkan)
                      </Label>
                      <ScrollArea className="h-32">
                        <div className="flex flex-wrap gap-2">
                          {charactersData?.characters?.map(
                            (char: Character) => (
                              <Badge
                                key={char.id}
                                variant={
                                  filters.characters.includes(char.id)
                                    ? "default"
                                    : "outline"
                                }
                                className={cn(
                                  "cursor-pointer transition-all",
                                  filters.characters.includes(char.id)
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "border-zinc-700 text-zinc-400 hover:border-emerald-500 hover:text-emerald-400"
                                )}
                                onClick={() => {
                                  setFilters((prev) => ({
                                    ...prev,
                                    characters: prev.characters.includes(
                                      char.id
                                    )
                                      ? prev.characters.filter(
                                          (id) => id !== char.id
                                        )
                                      : [...prev.characters, char.id],
                                  }));
                                  setPage(1);
                                }}
                              >
                                <Star
                                  className={cn(
                                    "w-3 h-3 mr-1",
                                    char.rarity === 5
                                      ? "text-amber-400"
                                      : "text-purple-400"
                                  )}
                                />
                                {char.name}
                              </Badge>
                            )
                          )}
                          {charactersData?.characters?.length === 0 && (
                            <p className="text-zinc-500 text-sm">
                              Tidak ada karakter tersedia
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Diamond Range */}
                      <div className="space-y-2">
                        <Label className="text-zinc-300 text-sm">
                          Diamond: {filters.minDiamond.toLocaleString()} -{" "}
                          {filters.maxDiamond.toLocaleString()}
                        </Label>
                        <Slider
                          value={[filters.minDiamond, filters.maxDiamond]}
                          min={0}
                          max={50000}
                          step={500}
                          onValueChange={([min, max]) => {
                            setFilters((prev) => ({
                              ...prev,
                              minDiamond: min,
                              maxDiamond: max,
                            }));
                            setPage(1);
                          }}
                        />
                      </div>

                      {/* Level Range */}
                      <div className="space-y-2">
                        <Label className="text-zinc-300 text-sm">
                          Level: {filters.minLevel} - {filters.maxLevel}
                        </Label>
                        <Slider
                          value={[filters.minLevel, filters.maxLevel]}
                          min={1}
                          max={70}
                          step={1}
                          onValueChange={([min, max]) => {
                            setFilters((prev) => ({
                              ...prev,
                              minLevel: min,
                              maxLevel: max,
                            }));
                            setPage(1);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Server Filter */}
                      <div className="space-y-2">
                        <Label className="text-zinc-300 text-sm">Server</Label>
                        <Select
                          value={filters.serverId || "all"}
                          onValueChange={(v) => {
                            setFilters((prev) => ({
                              ...prev,
                              serverId: v === "all" ? "" : v,
                            }));
                            setPage(1);
                          }}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Semua Server" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="all">Semua Server</SelectItem>
                            {serversData?.servers?.map((server: Server) => (
                              <SelectItem key={server.id} value={server.id}>
                                {server.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Gender Filter */}
                      <div className="space-y-2">
                        <Label className="text-zinc-300 text-sm">
                          Gender Protagonis
                        </Label>
                        <Select
                          value={filters.gender || "all"}
                          onValueChange={(v) => {
                            setFilters((prev) => ({
                              ...prev,
                              gender: v === "all" ? "" : v,
                            }));
                            setPage(1);
                          }}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Semua Gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="all">Semua Gender</SelectItem>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilters({
                          characters: [],
                          minDiamond: 0,
                          maxDiamond: 50000,
                          minLevel: 1,
                          maxLevel: 70,
                          serverId: "",
                          gender: "",
                        });
                        setPage(1);
                      }}
                      className="text-zinc-400 hover:text-white"
                    >
                      Reset Filter
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid Akun */}
          {isLoadingAccounts ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-emerald-500 h-8 w-8" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {accountsData?.accounts?.map((acc: Account) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    onCopy={handleCopyId}
                  />
                ))}
              </div>

              {/* No Results */}
              {accountsData?.accounts?.length === 0 && (
                <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
                  <AlertCircle className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-white font-medium">
                    Tidak ada akun ditemukan
                  </h3>
                  <p className="text-zinc-500 text-sm mt-1">
                    Coba ubah filter atau kata kunci pencarian Anda.
                  </p>
                </div>
              )}

              {/* Pagination */}
              {accountsData?.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="border-zinc-800 text-zinc-400"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-zinc-400 px-4">
                    Halaman {page} dari {accountsData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= accountsData.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="border-zinc-800 text-zinc-400"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
