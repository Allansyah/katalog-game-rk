"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Clock,
  DollarSign,
  CheckCircle,
  Gamepad2,
  Loader2,
  User,
  Calendar,
  RefreshCw,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDaysRemaining = (releaseDate: string | Date) => {
  const now = new Date();
  const release = new Date(releaseDate);
  const diffTime = release.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Komponen untuk filter tanggal
function DateRangeFilter({
  value,
  onChange,
}: {
  value: { from?: string; to?: string };
  onChange: (range: { from?: string; to?: string }) => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="date"
          value={value.from || ""}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="bg-zinc-800 border-zinc-700 pl-10 w-40"
          placeholder="Dari"
        />
      </div>
      <span className="text-zinc-400">-</span>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="date"
          value={value.to || ""}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="bg-zinc-800 border-zinc-700 pl-10 w-40"
          placeholder="Sampai"
        />
      </div>
    </div>
  );
}

function PendingTable({
  data,
  isLoading,
  onRelease,
  onReleaseAll,
  isReleasing,
  selectedIds,
  onSelectRow,
  onSelectAll,
}: {
  data: any;
  isLoading: boolean;
  onRelease: (id: string) => void;
  onReleaseAll: () => void;
  isReleasing: boolean;
  selectedIds: Set<string>;
  onSelectRow: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}) {
  const allIds = data?.pendingBalances?.map((pb: any) => pb.id) || [];

  return (
    <div className="space-y-4">
      {/* Tombol aksi massal */}
      {selectedIds.size > 0 && (
        <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center justify-between">
          <span className="text-sm text-zinc-300">
            {selectedIds.size} item(s) selected
          </span>
          <Button
            size="sm"
            onClick={onReleaseAll}
            disabled={isReleasing}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isReleasing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Release Selected
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === allIds.length && allIds.length > 0
                  }
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800"
                />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                Supplier
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                Account
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                Game
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                Amount
              </th>
              <th className="text-center py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                Days Left
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                Release Date
              </th>
              <th className="text-center py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                </td>
              </tr>
            ) : data?.pendingBalances?.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-zinc-400">
                  No pending balances
                </td>
              </tr>
            ) : (
              data?.pendingBalances?.map((pb: any) => (
                <tr
                  key={pb.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(pb.id)}
                      onChange={(e) => onSelectRow(pb.id, e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-800"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-zinc-300">{pb.user?.name}</p>
                        <p className="text-xs text-zinc-500">
                          {pb.user?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-white">
                      {pb.transaction?.account?.publicId}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-zinc-300">
                        {pb.transaction?.account?.game?.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-amber-400">
                      Rp {pb.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className="bg-amber-600/20 text-amber-400">
                      {getDaysRemaining(pb.releaseDate)} days
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-zinc-400">
                      {formatDate(pb.releaseDate)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRelease(pb.id)}
                      disabled={isReleasing}
                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/20"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Release
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReleasedTable({ data, isLoading }: { data: any; isLoading: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Supplier
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Account
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Game
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Amount
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Released At
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="text-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
              </td>
            </tr>
          ) : data?.pendingBalances?.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-10 text-zinc-400">
                No released balances yet
              </td>
            </tr>
          ) : (
            data?.pendingBalances?.map((pb: any) => (
              <tr
                key={pb.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-zinc-300">{pb.user?.name}</p>
                      <p className="text-xs text-zinc-500">{pb.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-white">
                    {pb.transaction?.account?.publicId}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-zinc-300">
                      {pb.transaction?.account?.game?.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-emerald-400">
                    Rp {pb.amount.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-zinc-400">
                    {formatDate(pb.releasedAt || pb.createdAt)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function PendingBalancesAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(
    {},
  );
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "single" | "all";
    ids?: string[];
  }>({ open: false, type: "single" });

  // Query params untuk filter
  const queryParams = new URLSearchParams();
  queryParams.set("status", "PENDING");
  if (dateRange.from) queryParams.set("from", dateRange.from);
  if (dateRange.to) queryParams.set("to", dateRange.to);
  if (search) queryParams.set("search", search);

  const {
    data: pendingData,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ["pending-balances-admin", "PENDING", dateRange, search],
    queryFn: async () => {
      const res = await fetch(
        `/api/pending-balances?${queryParams.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled:
      status === "authenticated" && session?.user?.role === "SUPER_ADMIN",
  });

  const {
    data: releasedData,
    isLoading: releasedLoading,
    refetch: refetchReleased,
  } = useQuery({
    queryKey: ["pending-balances-admin", "RELEASED", dateRange, search],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "RELEASED" });
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      if (search) params.set("search", search);
      const res = await fetch(`/api/pending-balances?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled:
      status === "authenticated" && session?.user?.role === "SUPER_ADMIN",
  });

  // Mutation untuk release single
  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pending-balances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RELEASED" }),
      });
      if (!res.ok) throw new Error("Failed to release");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Balance released successfully");
      queryClient.invalidateQueries({ queryKey: ["pending-balances-admin"] });
      setSelectedIds(new Set());
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation untuk release multiple
  // ... kode sebelumnya

  // Mutation untuk release multiple (BAGIAN YANG DIUBAH)
  const releaseMultipleMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // UBAH URL DARI /bulk MENJADI / (root endpoint)
      const res = await fetch("/api/pending-balances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: "RELEASED" }),
      });
      if (!res.ok) throw new Error("Failed to release selected");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.count} balances released successfully`);
      queryClient.invalidateQueries({ queryKey: ["pending-balances-admin"] });
      setSelectedIds(new Set());
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // ... kode setelahnya

  const handleRelease = (id: string) => {
    setConfirmDialog({ open: true, type: "single", ids: [id] });
  };

  const handleReleaseAll = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({ open: true, type: "all", ids: Array.from(selectedIds) });
  };

  const confirmRelease = () => {
    if (confirmDialog.type === "single" && confirmDialog.ids) {
      releaseMutation.mutate(confirmDialog.ids[0]);
    } else if (confirmDialog.type === "all" && confirmDialog.ids) {
      releaseMultipleMutation.mutate(confirmDialog.ids);
    }
    setConfirmDialog({ open: false, type: "single" });
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds =
        pendingData?.pendingBalances?.map((pb: any) => pb.id) || [];
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  useEffect(() => {
    if (
      status === "unauthenticated" ||
      (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN")
    ) {
      router.push("/dashboard/overview");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!session || session?.user?.role !== "SUPER_ADMIN") {
    return null;
  }

  const totalPending =
    pendingData?.pendingBalances?.reduce(
      (sum: number, pb: any) => sum + pb.amount,
      0,
    ) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Pending Balances</h1>
        <p className="text-zinc-400">Manage supplier pending earnings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-600/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Total Pending</p>
                <p className="text-xl font-bold text-white">
                  Rp {totalPending.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-600/20">
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Pending Count</p>
                <p className="text-xl font-bold text-white">
                  {pendingData?.pendingBalances?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Total Released</p>
                <p className="text-xl font-bold text-white">
                  {releasedData?.pagination?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by supplier or account..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-800 border-zinc-700 max-w-sm"
              />
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDateRange({});
                setSearch("");
              }}
              className="border-zinc-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <Tabs defaultValue="pending">
            <div className="border-b border-zinc-800 px-6 pt-4 flex justify-between items-center">
              <TabsList className="bg-zinc-800">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-amber-600"
                >
                  <Clock className="w-4 h-4 mr-2" /> Pending
                </TabsTrigger>
                <TabsTrigger
                  value="released"
                  className="data-[state=active]:bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Released
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="pending" className="p-6 pt-4">
              <PendingTable
                data={pendingData}
                isLoading={pendingLoading}
                onRelease={handleRelease}
                onReleaseAll={handleReleaseAll}
                isReleasing={
                  releaseMutation.isPending || releaseMultipleMutation.isPending
                }
                selectedIds={selectedIds}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
              />
            </TabsContent>
            <TabsContent value="released" className="p-6 pt-4">
              <ReleasedTable data={releasedData} isLoading={releasedLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, type: "single" })}
      >
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              Confirm Release
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "single"
                ? "Are you sure you want to release this pending balance? This action cannot be undone."
                : `Are you sure you want to release ${confirmDialog.ids?.length} selected pending balances? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, type: "single" })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRelease}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Yes, Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
