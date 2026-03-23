"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Loader2,
  CreditCard,
  Wallet,
  Trash,
  Upload,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  accountNo: string | null;
  accountName: string | null;
  imageUrl: string | null;
  instructions: string | null;
  status: boolean;
}

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null,
  );

  // State untuk form data (teks)
  const [formData, setFormData] = useState({
    name: "",
    type: "BANK_TRANSFER",
    accountNo: "",
    accountName: "",
    instructions: "",
    status: true,
  });

  // State khusus untuk file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch payment methods
  const { data: methods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Save mutation (menggunakan FormData)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      const isEdit = !!editingMethod;

      if (isEdit) data.append("id", editingMethod.id);
      data.append("name", formData.name);
      data.append("type", formData.type);
      data.append("status", String(formData.status));
      data.append("instructions", formData.instructions || "");

      // Jika Bukan QRIS, kirim data rekening
      if (formData.type !== "QRIS") {
        data.append("accountNo", formData.accountNo || "");
        data.append("accountName", formData.accountName || "");
      }

      // Logika Upload File QRIS
      if (formData.type === "QRIS") {
        if (selectedFile) {
          // Jika ada file baru
          data.append("file", selectedFile);
        } else if (isEdit && editingMethod?.imageUrl) {
          // Jika edit tapi tidak ganti gambar, kirim path lama agar tidak hilang
          data.append("existingImageUrl", editingMethod.imageUrl);
        }
      }

      const res = await fetch("/api/payment-methods", {
        method: isEdit ? "PUT" : "POST",
        body: data,
        // JANGAN set Content-Type header, browser akan otomatis set multipart/form-data
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(
        editingMethod ? "Payment method updated" : "Payment method created",
      );
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payment-methods?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payment method deleted");
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openModal = (method?: PaymentMethod) => {
    // Reset state file setiap buka modal
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        type: method.type,
        accountNo: method.accountNo || "",
        accountName: method.accountName || "",
        instructions: method.instructions || "",
        status: method.status,
      });
      // Jika edit dan ada gambar, tampilkan preview
      if (method.imageUrl) {
        setPreviewUrl(method.imageUrl);
      }
    } else {
      setEditingMethod(null);
      setFormData({
        name: "",
        type: "BANK_TRANSFER",
        accountNo: "",
        accountName: "",
        instructions: "",
        status: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Buat preview lokal
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validasi: Jika QRIS baru, wajib upload gambar
    if (formData.type === "QRIS" && !editingMethod && !selectedFile) {
      toast.error("QRIS image is required for new payment method");
      return;
    }
    saveMutation.mutate();
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      BANK_TRANSFER: "bg-blue-600/20 text-blue-400",
      E_WALLET: "bg-purple-600/20 text-purple-400",
      QRIS: "bg-green-600/20 text-green-400",
    };
    return (
      <Badge className={colors[type] || "bg-zinc-600/20 text-zinc-400"}>
        {type.replace("_", " ")}
      </Badge>
    );
  };

  const filteredMethods = methods?.methods?.filter((m: PaymentMethod) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && m.status) ||
      (statusFilter === "INACTIVE" && !m.status);

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Payment Methods
          </h1>
          <p className="text-zinc-400">Manage payment methods for top-up</p>
        </div>
        <Button
          onClick={() => openModal()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Method
        </Button>
      </div>

      {/* Search & Filter */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search payment methods..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-800 border-zinc-700 pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v)}
            >
              <SelectTrigger className="w-full md:w-[180px] bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
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
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Type</TableHead>
                    <TableHead className="text-zinc-400">Details</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMethods?.map((method: PaymentMethod) => (
                    <TableRow
                      key={method.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                            {method.type === "E_WALLET" ? (
                              <Wallet className="h-5 w-5 text-purple-400" />
                            ) : (
                              <CreditCard className="h-5 w-5 text-blue-400" />
                            )}
                          </div>
                          <span className="text-white font-medium">
                            {method.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(method.type)}</TableCell>
                      <TableCell className="text-white font-mono text-sm">
                        {method.type === "QRIS" ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {method.imageUrl ? "Image Uploaded" : "No Image"}
                          </span>
                        ) : (
                          <>
                            <div>{method.accountNo || "-"}</div>
                            <div className="text-zinc-500 text-xs">
                              {method.accountName || "-"}
                            </div>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            method.status
                              ? "bg-emerald-600/20 text-emerald-400"
                              : "bg-red-600/20 text-red-400"
                          }
                        >
                          {method.status ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(method)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this payment method?",
                                )
                              ) {
                                deleteMutation.mutate(method.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMethods?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-zinc-500 py-8"
                      >
                        No payment methods found
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
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g., BCA, GoPay, OVO, QRIS Center"
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => {
                  setFormData((p) => ({ ...p, type: v }));
                  // Reset file jika ganti tipe
                  if (v !== "QRIS") {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* KONDISI TAMPILAN FORM */}
            {formData.type === "QRIS" ? (
              <div className="space-y-2">
                <Label className="text-zinc-400">QRIS Image *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-zinc-800 border-zinc-700"
                  >
                    <Upload className="h-4 w-4 mr-2" /> Upload Image
                  </Button>
                  <span className="text-xs text-zinc-500 truncate max-w-[150px]">
                    {selectedFile
                      ? selectedFile.name
                      : editingMethod?.imageUrl
                        ? "Use existing image"
                        : "No file"}
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {previewUrl && (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={previewUrl}
                      alt="QR Preview"
                      className="w-40 h-40 object-contain rounded border border-zinc-700 bg-white p-1"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Account No</Label>
                  <Input
                    value={formData.accountNo}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, accountNo: e.target.value }))
                    }
                    placeholder="1234567890"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Account Name</Label>
                  <Input
                    value={formData.accountName}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        accountName: e.target.value,
                      }))
                    }
                    placeholder="John Doe"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-zinc-400">Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, instructions: e.target.value }))
                }
                placeholder="Payment instructions..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-zinc-400">Active</Label>
              <Switch
                checked={formData.status}
                onCheckedChange={(c) =>
                  setFormData((p) => ({ ...p, status: c }))
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
