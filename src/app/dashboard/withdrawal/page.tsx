// 'use client';

// import { useState, useEffect } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import {
//   Banknote,
//   ArrowRightLeft,
//   Wallet,
//   History,
//   Loader2,
//   CheckCircle,
//   XCircle,
//   Clock,
// } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { toast } from 'sonner';

// export default function WithdrawalPage() {
//   const { data: session, status } = useSession();
//   const router = useRouter();
//   const queryClient = useQueryClient();

//   const [withdrawDialog, setWithdrawDialog] = useState(false);
//   const [transferDialog, setTransferDialog] = useState(false);
//   const [amount, setAmount] = useState('');
//   const [bankName, setBankName] = useState('');
//   const [bankAccount, setBankAccount] = useState('');
//   const [accountName, setAccountName] = useState('');
//   const [withdrawSource, setWithdrawSource] = useState<'balance' | 'salesBalance'>('balance');

//   const { data: withdrawals, isLoading } = useQuery({
//     queryKey: ['withdrawals'],
//     queryFn: async () => {
//       const res = await fetch('/api/withdrawal');
//       return res.json();
//     },
//     enabled: status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN',
//   });

//   const withdrawMutation = useMutation({
//     mutationFn: async (data: any) => {
//       const res = await fetch('/api/withdrawal', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });
//       if (!res.ok) {
//         const error = await res.json();
//         throw new Error(error.error || 'Failed to create withdrawal');
//       }
//       return res.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
//       toast.success('Withdrawal request submitted');
//       setWithdrawDialog(false);
//       resetForm();
//     },
//     onError: (error: Error) => {
//       toast.error(error.message);
//     },
//   });

//   const transferMutation = useMutation({
//     mutationFn: async (data: any) => {
//       const res = await fetch('/api/withdrawal', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });
//       if (!res.ok) {
//         const error = await res.json();
//         throw new Error(error.error || 'Failed to transfer');
//       }
//       return res.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
//       toast.success('Transfer successful');
//       setTransferDialog(false);
//       setAmount('');
//     },
//     onError: (error: Error) => {
//       toast.error(error.message);
//     },
//   });

//   useEffect(() => {
//     if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN')) {
//       router.push('/dashboard/overview');
//     }
//   }, [status, session, router]);

//   const user = session?.user as any;
//   const isSupplier = session?.user?.role === 'SUPPLIER';

//   const resetForm = () => {
//     setAmount('');
//     setBankName('');
//     setBankAccount('');
//     setAccountName('');
//     setWithdrawSource('balance');
//   };

//   const handleWithdraw = () => {
//     if (!amount || parseFloat(amount) <= 0) {
//       toast.error('Please enter a valid amount');
//       return;
//     }
//     if (!bankName || !bankAccount || !accountName) {
//       toast.error('Please fill in all bank details');
//       return;
//     }

//     withdrawMutation.mutate({
//       amount: parseFloat(amount),
//       type: 'WITHDRAW',
//       source: withdrawSource,
//       bankName,
//       bankAccount,
//       accountName,
//     });
//   };

//   const handleTransfer = () => {
//     if (!amount || parseFloat(amount) <= 0) {
//       toast.error('Please enter a valid amount');
//       return;
//     }

//     transferMutation.mutate({
//       amount: parseFloat(amount),
//       type: 'TRANSFER',
//       source: 'salesBalance',
//     });
//   };

//   const formatDate = (date: string | Date) => {
//     return new Date(date).toLocaleDateString('id-ID', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'PENDING':
//         return <Badge className="bg-amber-600/20 text-amber-400"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
//       case 'APPROVED':
//         return <Badge className="bg-emerald-600/20 text-emerald-400"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
//       case 'REJECTED':
//         return <Badge className="bg-red-600/20 text-red-400"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
//       default:
//         return <Badge>{status}</Badge>;
//     }
//   };

//   if (status === 'loading') {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
//       </div>
//     );
//   }

//   if (!session || session?.user?.role === 'SUPER_ADMIN') {
//     return null;
//   }

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-white">Withdrawal</h1>
//         <p className="text-zinc-400">Withdraw your balance to bank account or transfer to purchase balance</p>
//       </div>

//       {/* Balance Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <Card className="bg-zinc-900 border-zinc-800">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-zinc-400">Purchase Balance</p>
//                 <p className="text-3xl font-bold text-white">Rp {user?.balance?.toLocaleString() || '0'}</p>
//                 <p className="text-xs text-zinc-500 mt-1">For buying accounts</p>
//               </div>
//               <div className="p-3 rounded-lg bg-emerald-600/20">
//                 <Wallet className="w-8 h-8 text-emerald-400" />
//               </div>
//             </div>
//             <Button
//               className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
//               onClick={() => setWithdrawDialog(true)}
//             >
//               <Banknote className="w-4 h-4 mr-2" /> Withdraw to Bank
//             </Button>
//           </CardContent>
//         </Card>

//         {isSupplier && (
//           <Card className="bg-zinc-900 border-zinc-800">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-zinc-400">Sales Balance</p>
//                   <p className="text-3xl font-bold text-white">Rp {user?.salesBalance?.toLocaleString() || '0'}</p>
//                   {user?.pendingBalance > 0 && (
//                     <p className="text-xs text-amber-400 mt-1">Pending: Rp {user?.pendingBalance?.toLocaleString()}</p>
//                   )}
//                 </div>
//                 <div className="p-3 rounded-lg bg-cyan-600/20">
//                   <Banknote className="w-8 h-8 text-cyan-400" />
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-2 mt-4">
//                 <Button
//                   variant="outline"
//                   className="border-zinc-700"
//                   onClick={() => setWithdrawDialog(true)}
//                 >
//                   <Banknote className="w-4 h-4 mr-2" /> Withdraw
//                 </Button>
//                 <Button
//                   className="bg-cyan-600 hover:bg-cyan-700"
//                   onClick={() => setTransferDialog(true)}
//                 >
//                   <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>

//       {/* Withdrawal History */}
//       <Card className="bg-zinc-900 border-zinc-800">
//         <CardHeader>
//           <CardTitle className="text-white flex items-center gap-2">
//             <History className="w-5 h-5" /> Withdrawal History
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div className="flex items-center justify-center py-10">
//               <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
//             </div>
//           ) : withdrawals?.withdrawals?.length === 0 ? (
//             <div className="text-center py-10 text-zinc-400">
//               <Banknote className="w-12 h-12 mx-auto mb-3 opacity-50" />
//               <p>No withdrawal history</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-zinc-800">
//                     <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Type</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Source</th>
//                     <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Amount</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Bank Details</th>
//                     <th className="text-center py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Status</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">Date</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {withdrawals?.withdrawals?.map((w: any) => (
//                     <tr key={w.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
//                       <td className="py-3 px-4">
//                         <Badge variant="outline" className="border-zinc-700">
//                           {w.type === 'WITHDRAW' ? (
//                             <><Banknote className="w-3 h-3 mr-1" /> Withdraw</>
//                           ) : (
//                             <><ArrowRightLeft className="w-3 h-3 mr-1" /> Transfer</>
//                           )}
//                         </Badge>
//                       </td>
//                       <td className="py-3 px-4 text-zinc-300">
//                         {w.source === 'balance' ? 'Purchase' : 'Sales'}
//                       </td>
//                       <td className="py-3 px-4 text-right font-semibold text-white">
//                         Rp {w.amount.toLocaleString()}
//                       </td>
//                       <td className="py-3 px-4 text-zinc-400 text-sm">
//                         {w.type === 'WITHDRAW' ? (
//                           <span>{w.bankName} - {w.bankAccount}</span>
//                         ) : (
//                           <span className="text-emerald-400">→ Purchase Balance</span>
//                         )}
//                       </td>
//                       <td className="py-3 px-4 text-center">{getStatusBadge(w.status)}</td>
//                       <td className="py-3 px-4 text-zinc-400 text-sm">{formatDate(w.createdAt)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Withdraw Dialog */}
//       <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
//         <DialogContent className="bg-zinc-900 border-zinc-800">
//           <DialogHeader>
//             <DialogTitle className="text-white">Withdraw to Bank Account</DialogTitle>
//             <DialogDescription className="text-zinc-400">
//               Enter the amount and your bank details. Your request will be processed by admin.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             {isSupplier && (
//               <div className="space-y-2">
//                 <Label className="text-zinc-300">Withdraw from</Label>
//                 <Select value={withdrawSource} onValueChange={(v: any) => setWithdrawSource(v)}>
//                   <SelectTrigger className="bg-zinc-800 border-zinc-700">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent className="bg-zinc-800 border-zinc-700">
//                     <SelectItem value="balance">Purchase Balance (Rp {user?.balance?.toLocaleString()})</SelectItem>
//                     <SelectItem value="salesBalance">Sales Balance (Rp {user?.salesBalance?.toLocaleString()})</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Amount</Label>
//               <Input
//                 type="number"
//                 placeholder="Enter amount"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 className="bg-zinc-800 border-zinc-700"
//               />
//               <p className="text-xs text-zinc-500">
//                 Available: Rp {withdrawSource === 'balance' ? user?.balance?.toLocaleString() : user?.salesBalance?.toLocaleString()}
//               </p>
//             </div>
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Bank Name</Label>
//               <Input
//                 placeholder="e.g., BCA, Mandiri, BRI"
//                 value={bankName}
//                 onChange={(e) => setBankName(e.target.value)}
//                 className="bg-zinc-800 border-zinc-700"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Bank Account Number</Label>
//               <Input
//                 placeholder="Enter account number"
//                 value={bankAccount}
//                 onChange={(e) => setBankAccount(e.target.value)}
//                 className="bg-zinc-800 border-zinc-700"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Account Holder Name</Label>
//               <Input
//                 placeholder="Enter account holder name"
//                 value={accountName}
//                 onChange={(e) => setAccountName(e.target.value)}
//                 className="bg-zinc-800 border-zinc-700"
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => { setWithdrawDialog(false); resetForm(); }}>Cancel</Button>
//             <Button
//               className="bg-emerald-600 hover:bg-emerald-700"
//               onClick={handleWithdraw}
//               disabled={withdrawMutation.isPending}
//             >
//               {withdrawMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
//               Submit Request
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Transfer Dialog */}
//       <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
//         <DialogContent className="bg-zinc-900 border-zinc-800">
//           <DialogHeader>
//             <DialogTitle className="text-white">Transfer to Purchase Balance</DialogTitle>
//             <DialogDescription className="text-zinc-400">
//               Move funds from your sales balance to purchase balance instantly.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <Label className="text-zinc-300">Amount</Label>
//               <Input
//                 type="number"
//                 placeholder="Enter amount"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 className="bg-zinc-800 border-zinc-700"
//               />
//               <p className="text-xs text-zinc-500">
//                 Available Sales Balance: Rp {user?.salesBalance?.toLocaleString()}
//               </p>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => { setTransferDialog(false); setAmount(''); }}>Cancel</Button>
//             <Button
//               className="bg-cyan-600 hover:bg-cyan-700"
//               onClick={handleTransfer}
//               disabled={transferMutation.isPending}
//             >
//               {transferMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
//               Transfer
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// baru
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  ArrowRightLeft,
  Wallet,
  History,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye, // Icon untuk lihat detail
  ExternalLink, // Icon untuk buka gambar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useUserBalance } from "@/hooks/useUserBalance";

// Definisikan tipe untuk history
type BankHistoryItem = {
  bankName: string;
  bankAccount: string;
  accountName: string;
};

export default function WithdrawalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    balance,
    isLoading: balanceLoading,
    refreshBalance,
  } = useUserBalance();

  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [amount, setAmount] = useState("");

  // State utama untuk input
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [accountName, setAccountName] = useState("");

  // State untuk modal detail
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    withdrawal: any;
  }>({ open: false, withdrawal: null });

  const [withdrawSource, setWithdrawSource] = useState<
    "balance" | "salesBalance"
  >("balance");

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterDate, setFilterDate] = useState<string>("");

  const [savedHistory, setSavedHistory] = useState<BankHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const item = window.localStorage.getItem("withdraw_history_data");
      const parsed = item ? JSON.parse(item) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const res = await fetch("/api/withdrawal");
      return res.json();
    },
    enabled:
      status === "authenticated" && session?.user?.role !== "SUPER_ADMIN",
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create withdrawal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      refreshBalance();

      if (typeof window !== "undefined") {
        const newEntry: BankHistoryItem = {
          bankName: bankName,
          bankAccount: bankAccount,
          accountName: accountName,
        };

        const existingHistory = savedHistory.filter(
          (item) => item.bankAccount !== newEntry.bankAccount,
        );

        const updatedHistory = [newEntry, ...existingHistory].slice(0, 5);

        setSavedHistory(updatedHistory);
        localStorage.setItem(
          "withdraw_history_data",
          JSON.stringify(updatedHistory),
        );
      }

      toast.success("Withdrawal request submitted");
      setWithdrawDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to transfer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      refreshBalance();
      toast.success("Transfer successful");
      setTransferDialog(false);
      setAmount("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (
      status === "unauthenticated" ||
      (status === "authenticated" && session?.user?.role === "SUPER_ADMIN")
    ) {
      router.push("/dashboard/overview");
    }
  }, [status, session, router]);

  const user = session?.user as any;
  const isSupplier = session?.user?.role === "SUPPLIER";

  const resetForm = () => {
    setAmount("");
    setBankName("");
    setBankAccount("");
    setAccountName("");
    setWithdrawSource("balance");
  };

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!bankName || !bankAccount || !accountName) {
      toast.error("Please fill in all bank details");
      return;
    }

    withdrawMutation.mutate({
      amount: parseFloat(amount),
      type: "WITHDRAW",
      source: withdrawSource,
      bankName,
      bankAccount,
      accountName,
    });
  };

  const handleTransfer = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    transferMutation.mutate({
      amount: parseFloat(amount),
      type: "TRANSFER",
      source: "salesBalance",
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-600/20 text-amber-400">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-emerald-600/20 text-emerald-400">
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-600/20 text-red-400">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!session || session?.user?.role === "SUPER_ADMIN") {
    return null;
  }

  const uniqueBankNames = [...new Set(savedHistory.map((h) => h.bankName))];
  const uniqueBankAccounts = [
    ...new Set(savedHistory.map((h) => h.bankAccount)),
  ];
  const uniqueAccountNames = [
    ...new Set(savedHistory.map((h) => h.accountName)),
  ];

  const filteredWithdrawals = withdrawals?.withdrawals?.filter((w: any) => {
    const matchStatus = filterStatus === "ALL" || w.status === filterStatus;
    let matchDate = true;
    if (filterDate) {
      const transactionDate = new Date(w.createdAt).toISOString().split("T")[0];
      matchDate = transactionDate === filterDate;
    }
    return matchStatus && matchDate;
  });

  return (
    <div className="space-y-6">
      {/* Header & Balance Cards (Sama seperti sebelumnya) */}
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawal</h1>
        <p className="text-zinc-400">
          Withdraw your balance to bank account or transfer to purchase balance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Purchase Balance</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-white">
                    Rp {balance?.toLocaleString() || "0"}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => refreshBalance()}
                    disabled={balanceLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 text-zinc-400 ${balanceLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  For buying accounts
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-600/20">
                <Wallet className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <Button
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setWithdrawDialog(true)}
            >
              <Banknote className="w-4 h-4 mr-2" /> Withdraw to Bank
            </Button>
          </CardContent>
        </Card>

        {isSupplier && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Sales Balance</p>
                  <p className="text-3xl font-bold text-white">
                    Rp {user?.salesBalance?.toLocaleString() || "0"}
                  </p>
                  {user?.pendingBalance > 0 && (
                    <p className="text-xs text-amber-400 mt-1">
                      Pending: Rp {user?.pendingBalance?.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-cyan-600/20">
                  <Banknote className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => setWithdrawDialog(true)}
                >
                  <Banknote className="w-4 h-4 mr-2" /> Withdraw
                </Button>
                <Button
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => setTransferDialog(true)}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Withdrawal History - DENGAN TAMBAHAN KOLOM ACTIONS */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5" /> Withdrawal History
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v)}
              >
                <SelectTrigger className="w-full sm:w-[140px] bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full sm:w-[180px] bg-zinc-800 border-zinc-700"
              />

              {(filterStatus !== "ALL" || filterDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white"
                  onClick={() => {
                    setFilterStatus("ALL");
                    setFilterDate("");
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : filteredWithdrawals?.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <Banknote className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>
                {withdrawals?.withdrawals?.length === 0
                  ? "No withdrawal history"
                  : "No results match your filter"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Source
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Bank Details
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Date
                    </th>
                    {/* TAMBAHAN: Header Actions */}
                    <th className="text-center py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals?.map((w: any) => (
                    <tr
                      key={w.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                    >
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="border-zinc-700">
                          {w.type === "WITHDRAW" ? (
                            <>
                              <Banknote className="w-3 h-3 mr-1" /> Withdraw
                            </>
                          ) : (
                            <>
                              <ArrowRightLeft className="w-3 h-3 mr-1" />{" "}
                              Transfer
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {w.source === "balance" ? "Purchase" : "Sales"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-white">
                        Rp {w.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-sm">
                        {w.type === "WITHDRAW" ? (
                          <span>
                            {w.bankName} - {w.bankAccount}
                          </span>
                        ) : (
                          <span className="text-emerald-400">
                            → Purchase Balance
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(w.status)}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-sm">
                        {formatDate(w.createdAt)}
                      </td>
                      {/* TAMBAHAN: Tombol Action */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-600/20"
                          onClick={() =>
                            setDetailDialog({ open: true, withdrawal: w })
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Dialog */}
      <Dialog
        open={withdrawDialog}
        onOpenChange={(open) => {
          setWithdrawDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Withdraw to Bank Account
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter the amount and your bank details. Your request will be
              processed by admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isSupplier && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Withdraw from</Label>
                <Select
                  value={withdrawSource}
                  onValueChange={(v: any) => setWithdrawSource(v)}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="balance">
                      Purchase Balance (Rp {balance?.toLocaleString() || 0})
                    </SelectItem>
                    <SelectItem value="salesBalance">
                      Sales Balance (Rp {user?.salesBalance?.toLocaleString()})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-zinc-300">Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500">
                Available: Rp{" "}
                {withdrawSource === "balance"
                  ? balance?.toLocaleString() || 0
                  : user?.salesBalance?.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Bank Name</Label>
              <Input
                placeholder="e.g., BCA, Mandiri, BRI"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
                list="bankNameList"
              />
              <datalist id="bankNameList">
                {uniqueBankNames.map((name, i) => (
                  <option key={i} value={name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Bank Account Number</Label>
              <Input
                placeholder="Enter account number"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
                list="bankAccountList"
              />
              <datalist id="bankAccountList">
                {uniqueBankAccounts.map((acc, i) => (
                  <option key={i} value={acc} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Account Holder Name</Label>
              <Input
                placeholder="Enter account holder name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
                list="accountNameList"
              />
              <datalist id="accountNameList">
                {uniqueAccountNames.map((name, i) => (
                  <option key={i} value={name} />
                ))}
              </datalist>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Transfer to Purchase Balance
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Move funds from your sales balance to purchase balance instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500">
                Available Sales Balance: Rp{" "}
                {user?.salesBalance?.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransferDialog(false);
                setAmount("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700"
              onClick={handleTransfer}
              disabled={transferMutation.isPending}
            >
              {transferMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal (BARU) */}
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
                  <span className="text-zinc-400">Amount:</span>
                  <span className="text-white font-bold">
                    Rp {detailDialog.withdrawal.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Status:</span>
                  {getStatusBadge(detailDialog.withdrawal.status)}
                </div>
                {detailDialog.withdrawal.type === "WITHDRAW" && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Bank:</span>
                    <span className="text-white text-right">
                      {detailDialog.withdrawal.bankName} -{" "}
                      {detailDialog.withdrawal.bankAccount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Date:</span>
                  <span className="text-white">
                    {formatDate(detailDialog.withdrawal.createdAt)}
                  </span>
                </div>
              </div>

              {/* Tampilkan Notes jika ada */}
              {detailDialog.withdrawal.notes && (
                <div>
                  <Label className="text-zinc-400 text-xs">Your Notes</Label>
                  <p className="text-white text-sm mt-1 bg-zinc-800 p-2 rounded">
                    {detailDialog.withdrawal.notes}
                  </p>
                </div>
              )}

              {detailDialog.withdrawal.adminNotes && (
                <div>
                  <Label className="text-zinc-400 text-xs">Admin Notes</Label>
                  <p className="text-white text-sm mt-1 bg-zinc-800 p-2 rounded">
                    {detailDialog.withdrawal.adminNotes}
                  </p>
                </div>
              )}

              {/* Tampilkan Gambar jika ada */}
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
                      className="absolute bottom-2 right-2 bg-black/50 p-2 rounded-md hover:bg-black/70 transition text-xs text-white flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Full
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
    </div>
  );
}
