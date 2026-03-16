'use client';

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

// Types
interface Game {
  id: string;
  name: string;
  code: string;
  icon?: string | null;
  status: boolean;
  _count?: { accounts: number };
}

interface Character {
  id: string;
  name: string;
  rarity: number;
  element?: string | null;
  imageUrl?: string | null;
}

interface Account {
  id: string;
  publicId: string;
  game: { name: string; code: string };
  level: number | null;
  diamond: number;
  server: string | null;
  gender: string | null;
  characters: Array<{
    id: string;
    name: string;
    rarity: number;
    element?: string | null;
  }>;
  basePrice: number;
  createdAt: string;
}

// Main Landing Page - Public Catalog
export default function LandingPage() {
  const { data: session } = useSession();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    characters: string[];
    minDiamond: number;
    maxDiamond: number;
    minLevel: number;
    maxLevel: number;
    server: string;
    gender: string;
  }>({
    characters: [],
    minDiamond: 0,
    maxDiamond: 50000,
    minLevel: 1,
    maxLevel: 70,
    server: "",
    gender: "",
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch games
  const { data: gamesData } = useQuery({
    queryKey: ["games-public"],
    queryFn: async () => {
      const res = await fetch("/api/games");
      return res.json();
    },
  });

  // Fetch characters for selected game
  const { data: charactersData } = useQuery({
    queryKey: ["characters", selectedGame?.id],
    queryFn: async () => {
      if (!selectedGame) return { characters: [] };
      const res = await fetch(`/api/games/${selectedGame.id}/characters`);
      return res.json();
    },
    enabled: !!selectedGame,
  });

  // Fetch accounts
  const { data: accountsData, isLoading } = useQuery({
    queryKey: ["accounts-public", selectedGame?.id, page, searchQuery, filters],
    queryFn: async () => {
      if (!selectedGame) return { accounts: [], pagination: { total: 0, totalPages: 0 } };

      const params = new URLSearchParams({
        gameId: selectedGame.id,
        page: page.toString(),
        limit: "20",
      });

      if (searchQuery) params.set("search", searchQuery);
      if (filters.characters.length > 0) params.set("characters", filters.characters.join(","));
      if (filters.minDiamond > 0) params.set("minDiamond", filters.minDiamond.toString());
      if (filters.maxDiamond < 50000) params.set("maxDiamond", filters.maxDiamond.toString());
      if (filters.minLevel > 1) params.set("minLevel", filters.minLevel.toString());
      if (filters.maxLevel < 70) params.set("maxLevel", filters.maxLevel.toString());
      if (filters.server) params.set("server", filters.server);
      if (filters.gender) params.set("gender", filters.gender);

      const res = await fetch(`/api/accounts?${params}`);
      return res.json();
    },
    enabled: !!selectedGame,
  });

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    toast.success("ID Copied!", { description: `Account ID: ${id}` });
  };

  // Game Selection View
  if (!selectedGame) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Rikkastore</h1>
                  <p className="text-xs text-zinc-400">Game Account Catalog</p>
                </div>
              </div>

              <nav className="flex items-center gap-2">
                {session ? (
                  <Link href="/dashboard/overview">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center space-y-4 mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-white"
            >
              Pilih Game
            </motion.h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Jelajahi katalog akun game berkualitas. Pilih game untuk melihat akun yang tersedia.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {gamesData?.games?.map((game: Game, index: number) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="cursor-pointer bg-zinc-900 border-zinc-800 hover:border-emerald-600/50 transition-colors group"
                  onClick={() => setSelectedGame(game)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-emerald-600/20 flex items-center justify-center group-hover:bg-emerald-600/30 transition-colors">
                      <span className="text-2xl font-bold text-emerald-400">{game.code}</span>
                    </div>
                    <h3 className="font-semibold text-white">{game.name}</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      {game._count?.accounts || 0} akun
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {gamesData?.games?.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-400">No games available</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 bg-zinc-900 py-4 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
            <p>© {new Date().getFullYear()} Rikkastore.id - Game Account Marketplace</p>
          </div>
        </footer>
      </div>
    );
  }

  // Catalog View
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Rikkastore</h1>
                <p className="text-xs text-zinc-400">Game Account Catalog</p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              {session ? (
                <Link href="/dashboard/overview">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedGame(null);
                setSearchQuery("");
                setFilters({
                  characters: [],
                  minDiamond: 0,
                  maxDiamond: 50000,
                  minLevel: 1,
                  maxLevel: 70,
                  server: "",
                  gender: "",
                });
                setPage(1);
              }}
              className="text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Kembali
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedGame.name}</h2>
              <p className="text-sm text-zinc-400">Katalog akun tersedia</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Cari Account ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10 bg-zinc-900 border-zinc-800 focus:border-emerald-600"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "border-zinc-800",
                showFilters && "border-emerald-600 bg-emerald-600/10"
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {filters.characters.length > 0 && (
                <Badge className="ml-2 bg-emerald-600">{filters.characters.length}</Badge>
              )}
            </Button>
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
                  <CardContent className="p-4 space-y-4">
                    {/* Character Filter */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Karakter (Pilih semua yang diinginkan)</Label>
                      <ScrollArea className="h-40">
                        <div className="flex flex-wrap gap-2">
                          {charactersData?.characters?.map((char: Character) => (
                            <Badge
                              key={char.id}
                              variant={filters.characters.includes(char.id) ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer transition-all",
                                filters.characters.includes(char.id)
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "border-zinc-700 hover:border-emerald-600"
                              )}
                              onClick={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  characters: prev.characters.includes(char.id)
                                    ? prev.characters.filter((id) => id !== char.id)
                                    : [...prev.characters, char.id],
                                }));
                                setPage(1);
                              }}
                            >
                              <Star
                                className={cn(
                                  "w-3 h-3 mr-1",
                                  char.rarity === 5 ? "text-amber-400" : "text-purple-400"
                                )}
                              />
                              {char.name}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Diamond Range */}
                      <div className="space-y-2">
                        <Label className="text-zinc-300">
                          Jumlah Diamond: {filters.minDiamond} - {filters.maxDiamond}
                        </Label>
                        <Slider
                          value={[filters.minDiamond, filters.maxDiamond]}
                          min={0}
                          max={50000}
                          step={100}
                          onValueChange={([min, max]) => {
                            setFilters((prev) => ({ ...prev, minDiamond: min, maxDiamond: max }));
                            setPage(1);
                          }}
                          className="w-full"
                        />
                      </div>

                      {/* Level Range */}
                      <div className="space-y-2">
                        <Label className="text-zinc-300">
                          Level: {filters.minLevel} - {filters.maxLevel}
                        </Label>
                        <Slider
                          value={[filters.minLevel, filters.maxLevel]}
                          min={1}
                          max={70}
                          step={1}
                          onValueChange={([min, max]) => {
                            setFilters((prev) => ({ ...prev, minLevel: min, maxLevel: max }));
                            setPage(1);
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Server Filter */}
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Server</Label>
                        <Select
                          value={filters.server || "all"}
                          onValueChange={(value) => {
                            setFilters((prev) => ({ ...prev, server: value === "all" ? "" : value }));
                            setPage(1);
                          }}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
                            <SelectValue placeholder="Semua Server" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="all">Semua Server</SelectItem>
                            <SelectItem value="Asia">Asia</SelectItem>
                            <SelectItem value="America">America</SelectItem>
                            <SelectItem value="Europe">Europe</SelectItem>
                            <SelectItem value="Global">Global</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Gender Filter */}
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Gender Protagonis</Label>
                        <Select
                          value={filters.gender || "all"}
                          onValueChange={(value) => {
                            setFilters((prev) => ({ ...prev, gender: value === "all" ? "" : value }));
                            setPage(1);
                          }}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
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
                          server: "",
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

          {/* Account Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {accountsData?.accounts?.map((account: Account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onCopyId={handleCopyId}
                  />
                ))}
              </div>

              {/* Pagination */}
              {accountsData?.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="border-zinc-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-zinc-400">
                    Page {page} of {accountsData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= accountsData.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="border-zinc-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* No Results Message */}
          {accountsData?.accounts?.length === 0 && !isLoading && (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-amber-400 mb-3" />
              <h3 className="text-lg font-medium text-white">Akun Tidak Ditemukan</h3>
              <p className="text-zinc-400 mt-1">
                Tidak ada akun yang sesuai dengan kriteria pencarian Anda.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Rikkastore.id - Game Account Marketplace</p>
        </div>
      </footer>
    </div>
  );
}

// Account Card Component
function AccountCard({
  account,
  onCopyId,
}: {
  account: Account;
  onCopyId: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopyId(account.publicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-600/50 transition-colors overflow-hidden group">
      <CardContent className="p-4">
        {/* Account ID */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="border-zinc-700 font-mono text-xs">
            {account.publicId}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-emerald-400"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3 text-sm">
          {account.level && (
            <div className="flex items-center gap-1 text-zinc-300">
              <Shield className="w-4 h-4 text-emerald-400" />
              Lv.{account.level}
            </div>
          )}
          <div className="flex items-center gap-1 text-zinc-300">
            <Diamond className="w-4 h-4 text-cyan-400" />
            {account.diamond.toLocaleString()}
          </div>
          {account.server && (
            <Badge variant="secondary" className="text-xs bg-zinc-800">
              {account.server}
            </Badge>
          )}
        </div>

        {/* Characters */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Characters:</p>
          <div className="flex flex-wrap gap-1">
            {account.characters.slice(0, 6).map((char) => (
              <Badge
                key={char.id}
                variant="outline"
                className={cn(
                  "text-xs",
                  char.rarity === 5
                    ? "border-amber-500/50 text-amber-400"
                    : "border-purple-500/50 text-purple-400"
                )}
              >
                {char.name}
              </Badge>
            ))}
            {account.characters.length > 6 && (
              <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                +{account.characters.length - 6}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
