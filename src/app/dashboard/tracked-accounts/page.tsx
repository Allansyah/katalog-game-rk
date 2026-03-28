"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Trash2,
  Loader2,
  Search,
  Plus,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ShoppingCart,
  List,
  Bookmark,
  MoveRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TrackedAccount {
  id: string;
  accountId: string;
  publicId: string;
  trackedAt: string;
  game: { id: string; name: string; code: string };
  server: { id: string; name: string } | null;
  level: number | null;
  diamond: number;
  basePrice: number;
  status: "AVAILABLE" | "LOCKED" | "SOLD";
  characters: { id: string; name: string; rarity?: number }[];
  weapons: { id: string; name: string; rarity?: number }[];
  transaction: {
    id: string;
    soldAt: string;
    buyer: string;
  } | null;
}

interface AllAccount {
  id: string;
  publicId: string;
  game: { id: string; name: string; code: string };
  server: { id: string; name: string } | null;
  level: number | null;
  diamond: number;
  basePrice: number;
  status: "AVAILABLE" | "LOCKED" | "SOLD";
  supplier: { id: string; name: string; email: string };
  characters: { id: string; name: string; rarity?: number }[];
  weapons: { id: string; name: string; rarity?: number }[];
  createdAt: string;
  updatedAt: string;
}

export default function TrackedAccountsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTrackedIds, setSelectedTrackedIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedAllIds, setSelectedAllIds] = useState<Set<string>>(new Set());
  const [addAccountId, setAddAccountId] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("tracked");

  // Fetch tracked accounts
  const {
    data: trackedData,
    isLoading: isLoadingTracked,
    refetch: refetchTracked,
    isRefetching: isRefetchingTracked,
  } = useQuery<{
    trackedAccounts: TrackedAccount[];
  }>({
    queryKey: ["tracked-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/tracked-accounts");
      if (!res.ok) throw new Error("Failed to fetch tracked accounts");
      return res.json();
    },
    refetchInterval: activeTab === "tracked" ? 30000 : false,
  });

  // Fetch all accounts
  const {
    data: allAccountsData,
    isLoading: isLoadingAllAccounts,
    refetch: refetchAllAccounts,
    isRefetching: isRefetchingAllAccounts,
  } = useQuery<{
    accounts: AllAccount[];
  }>({
    queryKey: ["all-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts/track");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
    enabled: activeTab === "all",
  });

  // Filter tracked accounts based on search query
  const filteredTrackedAccounts = useMemo(() => {
    const accounts = trackedData?.trackedAccounts || [];
    if (!searchQuery.trim()) return accounts;

    const lowerQuery = searchQuery.toLowerCase();
    return accounts.filter((account) => {
      if (account.publicId.toLowerCase().includes(lowerQuery)) return true;
      if (account.game.name.toLowerCase().includes(lowerQuery)) return true;
      if (account.server?.name?.toLowerCase().includes(lowerQuery)) return true;
      if (
        account.characters.some((char) =>
          char.name.toLowerCase().includes(lowerQuery)
        )
      )
        return true;
      return false;
    });
  }, [trackedData?.trackedAccounts, searchQuery]);

  // Filter all accounts based on search query
  const filteredAllAccounts = useMemo(() => {
    const accounts = allAccountsData?.accounts || [];
    if (!searchQuery.trim()) return accounts;

    const lowerQuery = searchQuery.toLowerCase();
    return accounts.filter((account) => {
      if (account.publicId.toLowerCase().includes(lowerQuery)) return true;
      if (account.game.name.toLowerCase().includes(lowerQuery)) return true;
      if (account.server?.name?.toLowerCase().includes(lowerQuery)) return true;
      if (account.supplier.name.toLowerCase().includes(lowerQuery)) return true;
      if (
        account.characters.some((char) =>
          char.name.toLowerCase().includes(lowerQuery)
        )
      )
        return true;
      return false;
    });
  }, [allAccountsData?.accounts, searchQuery]);

  // Remove tracking mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tracked-accounts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove tracking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-accounts"] });
      toast.success("Account removed from tracking");
    },
    onError: () => {
      toast.error("Failed to remove tracking");
    },
  });

  // Add tracking mutation for single account
  const addMutation = useMutation({
    mutationFn: async (publicId: string) => {
      const res = await fetch("/api/tracked-accounts/by-public-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add tracking");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tracked-accounts"] });
      toast.success(
        `Account ${data.trackedAccount.publicId} added to tracking`
      );
      setAddAccountId("");
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Bulk add tracking mutation
  const bulkAddMutation = useMutation({
    mutationFn: async (publicIds: string[]) => {
      const promises = publicIds.map((publicId) =>
        fetch("/api/tracked-accounts/by-public-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        })
      );
      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      return { successful, failed, total: publicIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tracked-accounts"] });
      setSelectedAllIds(new Set());
      if (data.failed === 0) {
        toast.success(`${data.successful} accounts added to tracking`);
      } else {
        toast.warning(
          `${data.successful} accounts added, ${data.failed} failed`
        );
      }
    },
    onError: () => {
      toast.error("Failed to add some accounts to tracking");
    },
  });

  // Bulk remove mutation for tracked accounts
  const bulkRemoveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map((id) =>
        fetch(`/api/tracked-accounts/${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      return { count: ids.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tracked-accounts"] });
      setSelectedTrackedIds(new Set());
      toast.success(`${data.count} accounts removed from tracking`);
    },
    onError: () => {
      toast.error("Failed to remove some accounts");
    },
  });

  const toggleSelectTracked = (id: string) => {
    const newSet = new Set(selectedTrackedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTrackedIds(newSet);
  };

  const toggleSelectAllTracked = () => {
    if (
      selectedTrackedIds.size === filteredTrackedAccounts.length &&
      filteredTrackedAccounts.length > 0
    ) {
      setSelectedTrackedIds(new Set());
    } else {
      setSelectedTrackedIds(new Set(filteredTrackedAccounts.map((a) => a.id)));
    }
  };

  const toggleSelectAll = (id: string) => {
    const newSet = new Set(selectedAllIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAllIds(newSet);
  };

  const toggleSelectAllAccounts = () => {
    if (
      selectedAllIds.size === filteredAllAccounts.length &&
      filteredAllAccounts.length > 0
    ) {
      setSelectedAllIds(new Set());
    } else {
      setSelectedAllIds(new Set(filteredAllAccounts.map((a) => a.id)));
    }
  };

  const handleAddAccount = () => {
    if (!addAccountId.trim()) {
      toast.error("Please enter an Account ID");
      return;
    }
    addMutation.mutate(addAccountId.trim());
  };

  const handleBulkRemove = () => {
    if (selectedTrackedIds.size === 0) {
      toast.error("No accounts selected");
      return;
    }
    bulkRemoveMutation.mutate([...selectedTrackedIds]);
  };

  const handleBulkAddToTracked = () => {
    if (selectedAllIds.size === 0) {
      toast.error("No accounts selected");
      return;
    }

    // Get the selected accounts by their IDs
    const selectedAccounts = filteredAllAccounts.filter((account) =>
      selectedAllIds.has(account.id)
    );

    // Check which accounts are already tracked
    const trackedPublicIds = new Set(
      trackedData?.trackedAccounts.map((t) => t.publicId) || []
    );

    const accountsToTrack = selectedAccounts.filter(
      (account) => !trackedPublicIds.has(account.publicId)
    );

    if (accountsToTrack.length === 0) {
      toast.info("All selected accounts are already being tracked");
      return;
    }

    const publicIdsToTrack = accountsToTrack.map((a) => a.publicId);
    bulkAddMutation.mutate(publicIdsToTrack);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <Badge className="bg-emerald-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
      case "LOCKED":
        return (
          <Badge className="bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Locked
          </Badge>
        );
      case "SOLD":
        return (
          <Badge className="bg-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Sold
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const trackedAccounts = trackedData?.trackedAccounts || [];
  const allAccounts = allAccountsData?.accounts || [];

  // Count by status (from full list, not filtered)
  const availableCount = trackedAccounts.filter(
    (a) => a.status === "AVAILABLE"
  ).length;
  const soldCount = trackedAccounts.filter((a) => a.status === "SOLD").length;
  const lockedCount = trackedAccounts.filter(
    (a) => a.status === "LOCKED"
  ).length;

  // All accounts summary
  const allAvailableCount = allAccounts.filter(
    (a) => a.status === "AVAILABLE"
  ).length;
  const allSoldCount = allAccounts.filter((a) => a.status === "SOLD").length;
  const allLockedCount = allAccounts.filter(
    (a) => a.status === "LOCKED"
  ).length;

  const isLoading =
    (activeTab === "tracked" && isLoadingTracked) ||
    (activeTab === "all" && isLoadingAllAccounts);
  const isRefetching =
    (activeTab === "tracked" && isRefetchingTracked) ||
    (activeTab === "all" && isRefetchingAllAccounts);

  const handleRefresh = () => {
    if (activeTab === "tracked") {
      refetchTracked();
    } else {
      refetchAllAccounts();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Account Management
          </h1>
          <p className="text-zinc-400">Monitor and manage accounts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="border-zinc-700 text-zinc-300"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {activeTab === "tracked" && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger
            value="tracked"
            className="data-[state=active]:bg-emerald-600"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Tracked Accounts
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-emerald-600"
          >
            <List className="h-4 w-4 mr-2" />
            All Accounts
          </TabsTrigger>
        </TabsList>

        {/* Tracked Accounts Tab */}
        <TabsContent value="tracked" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">
                  {trackedAccounts.length}
                </div>
                <div className="text-sm text-zinc-400">Total Tracked</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-emerald-400">
                  {availableCount}
                </div>
                <div className="text-sm text-zinc-400">Available</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-400">
                  {soldCount}
                </div>
                <div className="text-sm text-zinc-400">Sold</div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          {selectedTrackedIds.size > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">
                    {selectedTrackedIds.size} account(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTrackedIds(new Set())}
                      className="border-zinc-700 text-zinc-300"
                    >
                      Clear Selection
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkRemove}
                      disabled={bulkRemoveMutation.isPending}
                    >
                      {bulkRemoveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Remove Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracked Accounts List */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-white">
                  Your Tracked Accounts
                </CardTitle>
                <div className="flex items-center gap-4">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      placeholder="Search by ID, game, server, character..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 pl-10"
                    />
                  </div>
                  {filteredTrackedAccounts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all-tracked"
                        checked={
                          selectedTrackedIds.size ===
                            filteredTrackedAccounts.length &&
                          filteredTrackedAccounts.length > 0
                        }
                        onCheckedChange={toggleSelectAllTracked}
                      />
                      <label
                        htmlFor="select-all-tracked"
                        className="text-sm text-zinc-400 cursor-pointer"
                      >
                        Select All
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTracked ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
              ) : filteredTrackedAccounts.length === 0 ? (
                <div className="text-center py-12">
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400 mb-2">
                        No accounts match "{searchQuery}"
                      </p>
                      <Button
                        variant="link"
                        onClick={() => setSearchQuery("")}
                        className="text-emerald-400"
                      >
                        Clear search
                      </Button>
                    </>
                  ) : (
                    <>
                      <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400 mb-4">
                        No accounts tracked yet
                      </p>
                      <Button
                        onClick={() => setShowAddDialog(true)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account to Track
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredTrackedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        account.status === "SOLD"
                          ? "bg-red-900/10 border-red-900/30"
                          : account.status === "LOCKED"
                          ? "bg-yellow-900/10 border-yellow-900/30"
                          : "bg-zinc-800/50 border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedTrackedIds.has(account.id)}
                          onCheckedChange={() =>
                            toggleSelectTracked(account.id)
                          }
                          className="mt-1"
                        />

                        {/* Account Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-mono text-white font-medium">
                              {account.publicId}
                            </span>
                            {getStatusBadge(account.status)}
                            <Badge
                              variant="outline"
                              className="border-zinc-700 text-zinc-300"
                            >
                              {account.game.name}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-zinc-500">Level:</span>
                              <span className="text-zinc-300 ml-1">
                                {account.level || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Diamond:</span>
                              <span className="text-emerald-400 ml-1">
                                {account.diamond.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Server:</span>
                              <span className="text-zinc-300 ml-1">
                                {account.server?.name || "-"}
                              </span>
                            </div>
                          </div>

                          {/* Characters */}
                          {account.characters.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-zinc-500">
                                Characters:{" "}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {account.characters
                                  .map((c) => c.name)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/extract?accountId=${account.publicId}`
                              )
                            }
                            className="text-zinc-400 hover:text-white"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMutation.mutate(account.id)}
                            disabled={removeMutation.isPending}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Accounts Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-emerald-400">
                  {allAvailableCount}
                </div>
                <div className="text-sm text-zinc-400">Available</div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions for All Accounts */}
          {selectedAllIds.size > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">
                    {selectedAllIds.size} account(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAllIds(new Set())}
                      className="border-zinc-700 text-zinc-300"
                    >
                      Clear Selection
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkAddToTracked}
                      disabled={bulkAddMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {bulkAddMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <MoveRight className="h-4 w-4 mr-2" />
                      )}
                      Add to Tracked ({selectedAllIds.size})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Accounts List */}
          {/* All Accounts List */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-white">Available Accounts</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      placeholder="Search by ID, game, server, supplier, character..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 pl-10"
                    />
                  </div>
                  {filteredAllAccounts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all-accounts"
                        checked={
                          selectedAllIds.size === filteredAllAccounts.length &&
                          filteredAllAccounts.length > 0
                        }
                        onCheckedChange={toggleSelectAllAccounts}
                      />
                      <label
                        htmlFor="select-all-accounts"
                        className="text-sm text-zinc-400 cursor-pointer"
                      >
                        Select All
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAllAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
              ) : filteredAllAccounts.length === 0 ? (
                <div className="text-center py-12">
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400 mb-2">
                        No accounts match "{searchQuery}"
                      </p>
                      <Button
                        variant="link"
                        onClick={() => setSearchQuery("")}
                        className="text-emerald-400"
                      >
                        Clear search
                      </Button>
                    </>
                  ) : (
                    <>
                      <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400">
                        No available accounts found
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredAllAccounts.map((account) => (
                    <div
                      key={account.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        account.status === "LOCKED"
                          ? "bg-yellow-900/10 border-yellow-900/30"
                          : "bg-zinc-800/50 border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedAllIds.has(account.id)}
                          onCheckedChange={() => toggleSelectAll(account.id)}
                          className="mt-1"
                        />

                        {/* Account Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-mono text-white font-medium">
                              {account.publicId}
                            </span>
                            {getStatusBadge(account.status)}
                            <Badge
                              variant="outline"
                              className="border-zinc-700 text-zinc-300"
                            >
                              {account.game.name}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-zinc-500">Level:</span>
                              <span className="text-zinc-300 ml-1">
                                {account.level || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Diamond:</span>
                              <span className="text-emerald-400 ml-1">
                                {account.diamond.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Server:</span>
                              <span className="text-zinc-300 ml-1">
                                {account.server?.name || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Supplier:</span>
                              <span className="text-zinc-300 ml-1">
                                {account.supplier.name}
                              </span>
                            </div>
                          </div>

                          {/* Characters */}
                          {account.characters.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-zinc-500">
                                Characters:{" "}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {account.characters
                                  .map((c) => c.name)
                                  .join(", ")}
                              </span>
                            </div>
                          )}

                          {/* Weapons */}
                          {account.weapons.length > 0 && (
                            <div className="mt-1">
                              <span className="text-xs text-zinc-500">
                                Weapons:{" "}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {account.weapons.map((w) => w.name).join(", ")}
                              </span>
                            </div>
                          )}

                          {/* Created/Updated Info */}
                          <div className="mt-2 text-xs text-zinc-500">
                            Created:{" "}
                            {new Date(account.createdAt).toLocaleDateString(
                              "id-ID"
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/extract?accountId=${account.publicId}`
                              )
                            }
                            className="text-zinc-400 hover:text-white"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>

                          {/* Individual track button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              addMutation.mutate(account.publicId);
                            }}
                            disabled={addMutation.isPending}
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Track this account"
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Add Account to Track
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter the Account ID (public ID) to track its status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Enter Account ID (e.g., WW-1704708578-X29F)"
                value={addAccountId}
                onChange={(e) => setAddAccountId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAccount()}
                className="bg-zinc-800 border-zinc-700 pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 border-zinc-700 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAccount}
                disabled={addMutation.isPending || !addAccountId.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {addMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add to Track
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
