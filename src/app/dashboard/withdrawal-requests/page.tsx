"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  Eye,
  Upload,
  X,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Helper format date
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Tabel Komponen
function RequestsTable({
  data,
  isLoading,
  showActions = false,
  onApprove,
  onReject,
  onViewDetail,
}: {
  data: any;
  isLoading: boolean;
  showActions?: boolean;
  onApprove?: (w: any) => void;
  onReject?: (w: any) => void;
  onViewDetail?: (w: any) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              User
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Type
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Amount
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Bank Details
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Date
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="text-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
              </td>
            </tr>
          ) : data?.withdrawals?.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-zinc-400">
                No withdrawal requests
              </td>
            </tr>
          ) : (
            data?.withdrawals?.map((w: any) => (
              <tr
                key={w.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-zinc-300">{w.user?.name}</p>
                      <p className="text-xs text-zinc-500">{w.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge variant="outline" className="border-zinc-700">
                    {w.type === "WITHDRAW" ? (
                      <>
                        <Banknote className="w-3 h-3 mr-1" /> Withdraw
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-3 h-3 mr-1" /> Transfer
                      </>
                    )}
                  </Badge>
                  <span className="text-xs text-zinc-500 ml-2">
                    ({w.source === "balance" ? "Purchase" : "Sales"})
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-semibold text-white">
                  Rp {w.amount.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-zinc-400 text-sm">
                  {w.type === "WITHDRAW" ? (
                    <div>
                      <p>{w.bankName}</p>
                      <p className="text-xs">
                        {w.bankAccount} - {w.accountName}
                      </p>
                    </div>
                  ) : (
                    <span className="text-emerald-400">→ Purchase Balance</span>
                  )}
                </td>
                <td className="py-3 px-4 text-zinc-400 text-sm">
                  {formatDate(w.createdAt)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    {/* Tombol Detail */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-600/20"
                      onClick={() => onViewDetail?.(w)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {showActions && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 h-8"
                          onClick={() => onApprove?.(w)}
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8"
                          onClick={() => onReject?.(w)}
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function WithdrawalRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [processDialog, setProcessDialog] = useState<{
    open: boolean;
    withdrawal: any;
    action: "approve" | "reject" | null;
  }>({ open: false, withdrawal: null, action: null });
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    withdrawal: any;
  }>({ open: false, withdrawal: null });
  const [adminNotes, setAdminNotes] = useState("");

  // State untuk file upload
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Query Fetching (Sama seperti sebelumnya)
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["withdrawal-requests", "PENDING"],
    queryFn: async () => {
      const res = await fetch("/api/withdrawal-requests?status=PENDING");
      return res.json();
    },
    enabled:
      status === "authenticated" && session?.user?.role === "SUPER_ADMIN",
  });
  const { data: approvedData, isLoading: approvedLoading } = useQuery({
    queryKey: ["withdrawal-requests", "APPROVED"],
    queryFn: async () => {
      const res = await fetch("/api/withdrawal-requests?status=APPROVED");
      return res.json();
    },
    enabled:
      status === "authenticated" && session?.user?.role === "SUPER_ADMIN",
  });
  const { data: rejectedData, isLoading: rejectedLoading } = useQuery({
    queryKey: ["withdrawal-requests", "REJECTED"],
    queryFn: async () => {
      const res = await fetch("/api/withdrawal-requests?status=REJECTED");
      return res.json();
    },
    enabled:
      status === "authenticated" && session?.user?.role === "SUPER_ADMIN",
  });

  const processMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      action: "approve" | "reject";
      adminNotes?: string;
      file?: File | null;
    }) => {
      // Gunakan FormData untuk mengirim file
      const formData = new FormData();
      formData.append("action", data.action);
      if (data.adminNotes) formData.append("adminNotes", data.adminNotes);
      if (data.file) formData.append("file", data.file);

      const res = await fetch(`/api/withdrawal-requests/${data.id}/process`, {
        method: "POST",
        body: formData, // Kirim sebagai FormData, BUKAN JSON
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to process withdrawal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawal-requests"] });
      toast.success("Withdrawal processed successfully");
      setProcessDialog({ open: false, withdrawal: null, action: null });
      setAdminNotes("");
      setProofFile(null);
      setProofPreview(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (
      status === "unauthenticated" ||
      (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN")
    ) {
      router.push("/dashboard/overview");
    }
  }, [status, session, router]);

  const handleProcess = (withdrawal: any, action: "approve" | "reject") => {
    setProcessDialog({ open: true, withdrawal, action });
    // Reset state file setiap buka dialog baru
    setProofFile(null);
    setProofPreview(null);
    setAdminNotes("");
  };

  const handleViewDetail = (withdrawal: any) => {
    setDetailDialog({ open: true, withdrawal });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmProcess = () => {
    if (processDialog.withdrawal && processDialog.action) {
      processMutation.mutate({
        id: processDialog.withdrawal.id,
        action: processDialog.action,
        adminNotes,
        file: proofFile, // Kirim file
      });
    }
  };

  if (
    status === "loading" ||
    !session ||
    session?.user?.role !== "SUPER_ADMIN"
  ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Summary Cards (Sama seperti sebelumnya) */}
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawal Requests</h1>
        <p className="text-zinc-400">Manage user withdrawal requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-600/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Pending</p>
                <p className="text-xl font-bold text-white">
                  {pendingData?.pagination?.total || 0}
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
                <p className="text-xs text-zinc-400">Approved</p>
                <p className="text-xl font-bold text-white">
                  {approvedData?.pagination?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-600/20">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Rejected</p>
                <p className="text-xl font-bold text-white">
                  {rejectedData?.pagination?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <Tabs defaultValue="pending">
            <div className="border-b border-zinc-800 px-6 pt-4">
              <TabsList className="bg-zinc-800">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-amber-600"
                >
                  <Clock className="w-4 h-4 mr-2" /> Pending
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approved
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="data-[state=active]:bg-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Rejected
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="pending" className="p-6 pt-4">
              <RequestsTable
                data={pendingData}
                isLoading={pendingLoading}
                showActions
                onApprove={(w) => handleProcess(w, "approve")}
                onReject={(w) => handleProcess(w, "reject")}
                onViewDetail={handleViewDetail}
              />
            </TabsContent>
            <TabsContent value="approved" className="p-6 pt-4">
              <RequestsTable
                data={approvedData}
                isLoading={approvedLoading}
                onViewDetail={handleViewDetail}
              />
            </TabsContent>
            <TabsContent value="rejected" className="p-6 pt-4">
              <RequestsTable
                data={rejectedData}
                isLoading={rejectedLoading}
                onViewDetail={handleViewDetail}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => setDetailDialog({ open, withdrawal: null })}
      >
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Withdrawal Details</DialogTitle>
          </DialogHeader>
          {detailDialog.withdrawal && (
            <div className="space-y-4 py-4">
              <div className="bg-zinc-800 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">User:</span>
                  <span className="text-white">
                    {detailDialog.withdrawal.user?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="text-white font-bold">
                    Rp {detailDialog.withdrawal.amount?.toLocaleString()}
                  </span>
                </div>
                {detailDialog.withdrawal.type === "WITHDRAW" && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Bank:</span>
                    <span className="text-white">
                      {detailDialog.withdrawal.bankName} -{" "}
                      {detailDialog.withdrawal.bankAccount}
                    </span>
                  </div>
                )}
              </div>

              {detailDialog.withdrawal.adminNotes && (
                <div>
                  <Label className="text-zinc-400 text-xs">Admin Notes</Label>
                  <p className="text-white text-sm mt-1 bg-zinc-800 p-2 rounded">
                    {detailDialog.withdrawal.adminNotes}
                  </p>
                </div>
              )}

              {/* Tampilkan Gambar */}
              {detailDialog.withdrawal.imageUrl ? (
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">
                    Proof of Transfer
                  </Label>
                  <div className="relative w-full aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                    <img
                      src={detailDialog.withdrawal.imageUrl}
                      alt="Proof"
                      className="w-full h-full object-contain"
                    />
                    <a
                      href={detailDialog.withdrawal.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-black/50 p-1 rounded hover:bg-black/70 transition"
                    >
                      <ExternalLink className="w-4 h-4 text-white" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-500 text-sm py-4 border border-dashed border-zinc-700 rounded-lg">
                  No image uploaded
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialog({ open: false, withdrawal: null })}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Dialog (Approve/Reject) */}
      <Dialog
        open={processDialog.open}
        onOpenChange={(open) => setProcessDialog({ ...processDialog, open })}
      >
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {processDialog.action === "approve"
                ? "Approve Withdrawal"
                : "Reject Withdrawal"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {processDialog.action === "approve"
                ? "Upload proof of transfer and approve the request."
                : "Reject the request. Balance will be refunded to user."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {processDialog.withdrawal && (
              <div className="bg-zinc-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="text-white font-semibold">
                    Rp {processDialog.withdrawal.amount?.toLocaleString()}
                  </span>
                </div>
                {processDialog.withdrawal.bankName && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Bank:</span>
                    <span className="text-white">
                      {processDialog.withdrawal.bankName} -{" "}
                      {processDialog.withdrawal.bankAccount}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Input Upload File (Hanya saat Approve) */}
            {processDialog.action === "approve" && (
              <div className="space-y-2">
                <Label className="text-zinc-300">
                  Proof of Transfer (Image)
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-zinc-700"
                    onClick={() =>
                      document.getElementById("proofFile")?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />{" "}
                    {proofFile ? "Change Image" : "Upload Image"}
                  </Button>
                  <input
                    id="proofFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {proofPreview && (
                  <div className="relative mt-2 group">
                    <img
                      src={proofPreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {
                        setProofFile(null);
                        setProofPreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-zinc-300">Admin Notes (optional)</Label>
              <Textarea
                placeholder="Add notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setProcessDialog({
                  open: false,
                  withdrawal: null,
                  action: null,
                })
              }
            >
              Cancel
            </Button>
            <Button
              className={
                processDialog.action === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }
              onClick={confirmProcess}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {processDialog.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
