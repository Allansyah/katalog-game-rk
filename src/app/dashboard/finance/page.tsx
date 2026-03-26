// "use client";

// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import {
//   Wallet,
//   TrendingUp,
//   Users,
//   Package,
//   Loader2,
//   Calendar,
//   Filter,
//   ChevronLeft,
//   ChevronRight,
//   ArrowUpDown,
//   RefreshCw,
// } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";
// import { format } from "date-fns";
// import { id } from "date-fns/locale";

// // Komponen Date Range Picker sederhana
// function DateRangeFilter({
//   value,
//   onChange,
// }: {
//   value: { from?: string; to?: string };
//   onChange: (range: { from?: string; to?: string }) => void;
// }) {
//   return (
//     <div className="flex gap-2 items-center">
//       <div className="relative">
//         <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
//         <Input
//           type="date"
//           value={value.from || ""}
//           onChange={(e) => onChange({ ...value, from: e.target.value })}
//           className="bg-zinc-800 border-zinc-700 pl-10 w-40"
//           placeholder="Dari"
//         />
//       </div>
//       <span className="text-zinc-400">-</span>
//       <div className="relative">
//         <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
//         <Input
//           type="date"
//           value={value.to || ""}
//           onChange={(e) => onChange({ ...value, to: e.target.value })}
//           className="bg-zinc-800 border-zinc-700 pl-10 w-40"
//           placeholder="Sampai"
//         />
//       </div>
//     </div>
//   );
// }

// // Tipe activity (balance log) dari API
// interface Activity {
//   id: string;
//   type: string;
//   amount: number;
//   description: string | null;
//   createdAt: string;
//   user: {
//     name: string;
//   } | null;
// }

// interface Stats {
//   totalVolume: number;
//   totalTopups: number;
//   activeUsers: number;
//   totalSales: number;
// }

// interface FinanceResponse {
//   data: Activity[];
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
//   stats: Stats;
// }

// export default function FinancePage() {
//   const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(
//     {}
//   );
//   const [typeFilter, setTypeFilter] = useState<string>("ALL");
//   const [page, setPage] = useState(1);
//   const [sortBy, setSortBy] = useState("createdAt");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
//   const limit = 20;

//   // Build query params
//   const queryParams = new URLSearchParams();
//   if (dateRange.from) queryParams.set("from", dateRange.from);
//   if (dateRange.to) queryParams.set("to", dateRange.to);
//   if (typeFilter && typeFilter !== "ALL") queryParams.set("type", typeFilter);
//   queryParams.set("page", page.toString());
//   queryParams.set("limit", limit.toString());
//   queryParams.set("sortBy", sortBy);
//   queryParams.set("sortOrder", sortOrder);

//   // Fetch finance stats & activities
//   const { data, isLoading, error, refetch } = useQuery<FinanceResponse>({
//     queryKey: ["finance-stats", queryParams.toString()],
//     queryFn: async () => {
//       const res = await fetch(`/api/finance/stats?${queryParams.toString()}`);
//       if (!res.ok) throw new Error("Failed to fetch stats");
//       return res.json();
//     },
//   });

//   const handleSort = (column: string) => {
//     if (sortBy === column) {
//       setSortOrder(sortOrder === "asc" ? "desc" : "asc");
//     } else {
//       setSortBy(column);
//       setSortOrder("desc");
//     }
//   };

//   const resetFilters = () => {
//     setDateRange({});
//     setTypeFilter("ALL");
//     setPage(1);
//     setSortBy("createdAt");
//     setSortOrder("desc");
//   };

//   if (isLoading && !data) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
//       </div>
//     );
//   }

//   const stats = data?.stats;

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl md:text-3xl font-bold text-white">
//           Finance Overview
//         </h1>
//         <p className="text-zinc-400">Platform financial statistics</p>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         <Card className="bg-zinc-900 border-zinc-800">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-zinc-400 text-sm">Total Volume</p>
//                 <p className="text-2xl font-bold text-white">
//                   Rp {(stats?.totalVolume || 0).toLocaleString()}
//                 </p>
//               </div>
//               <div className="p-3 rounded-full bg-emerald-600/20">
//                 <Wallet className="h-6 w-6 text-emerald-400" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="bg-zinc-900 border-zinc-800">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-zinc-400 text-sm">Total Top-ups</p>
//                 <p className="text-2xl font-bold text-white">
//                   Rp {(stats?.totalTopups || 0).toLocaleString()}
//                 </p>
//               </div>
//               <div className="p-3 rounded-full bg-blue-600/20">
//                 <TrendingUp className="h-6 w-6 text-blue-400" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="bg-zinc-900 border-zinc-800">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-zinc-400 text-sm">Active Users</p>
//                 <p className="text-2xl font-bold text-white">
//                   {stats?.activeUsers || 0}
//                 </p>
//               </div>
//               <div className="p-3 rounded-full bg-yellow-600/20">
//                 <Users className="h-6 w-6 text-yellow-400" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="bg-zinc-900 border-zinc-800">
//           <CardContent className="p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-zinc-400 text-sm">Total Sales</p>
//                 <p className="text-2xl font-bold text-white">
//                   {stats?.totalSales || 0}
//                 </p>
//               </div>
//               <div className="p-3 rounded-full bg-purple-600/20">
//                 <Package className="h-6 w-6 text-purple-400" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters */}
//       <Card className="bg-zinc-900 border-zinc-800">
//         <CardHeader>
//           <CardTitle className="text-white flex items-center gap-2">
//             <Filter className="h-5 w-5" />
//             Filters
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="flex flex-col md:flex-row gap-4 items-end">
//             <div className="flex-1 space-y-2">
//               <Label className="text-zinc-400">Date Range</Label>
//               <DateRangeFilter value={dateRange} onChange={setDateRange} />
//             </div>
//             <div className="w-full md:w-48 space-y-2">
//               <Label className="text-zinc-400">Activity Type</Label>
//               <Select value={typeFilter} onValueChange={setTypeFilter}>
//                 <SelectTrigger className="bg-zinc-800 border-zinc-700">
//                   <SelectValue placeholder="All Types" />
//                 </SelectTrigger>
//                 <SelectContent className="bg-zinc-800 border-zinc-700">
//                   <SelectItem value="ALL">All Types</SelectItem>
//                   <SelectItem value="TOPUP">Top-up</SelectItem>
//                   <SelectItem value="DEDUCTION">Deduction</SelectItem>
//                   <SelectItem value="EARNING">Earning</SelectItem>
//                   <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
//                   <SelectItem value="TRANSFER">Transfer</SelectItem>
//                   <SelectItem value="SALES_RELEASED">Sales Released</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <Button
//               variant="outline"
//               onClick={resetFilters}
//               className="border-zinc-700"
//             >
//               <RefreshCw className="h-4 w-4 mr-2" />
//               Reset
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Activity Table */}
//       <Card className="bg-zinc-900 border-zinc-800">
//         <CardHeader>
//           <CardTitle className="text-white">Financial Activity</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
//                   <TableHead
//                     className="text-zinc-400 cursor-pointer"
//                     onClick={() => handleSort("type")}
//                   >
//                     Type <ArrowUpDown className="inline h-4 w-4 ml-1" />
//                   </TableHead>
//                   <TableHead className="text-zinc-400">Description</TableHead>
//                   <TableHead className="text-zinc-400">User</TableHead>
//                   <TableHead
//                     className="text-zinc-400 text-right cursor-pointer"
//                     onClick={() => handleSort("amount")}
//                   >
//                     Amount <ArrowUpDown className="inline h-4 w-4 ml-1" />
//                   </TableHead>
//                   <TableHead
//                     className="text-zinc-400 cursor-pointer"
//                     onClick={() => handleSort("createdAt")}
//                   >
//                     Date <ArrowUpDown className="inline h-4 w-4 ml-1" />
//                   </TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {isLoading ? (
//                   <TableRow>
//                     <TableCell colSpan={5} className="text-center py-8">
//                       <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
//                     </TableCell>
//                   </TableRow>
//                 ) : data?.data.length === 0 ? (
//                   <TableRow>
//                     <TableCell
//                       colSpan={5}
//                       className="text-center py-8 text-zinc-400"
//                     >
//                       No activities found
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   data?.data.map((activity) => (
//                     <TableRow
//                       key={activity.id}
//                       className="border-zinc-800 hover:bg-zinc-800/50"
//                     >
//                       <TableCell>
//                         <Badge
//                           className={
//                             activity.type === "TOPUP"
//                               ? "bg-emerald-600/20 text-emerald-400"
//                               : activity.type === "EARNING"
//                               ? "bg-blue-600/20 text-blue-400"
//                               : activity.type === "DEDUCTION"
//                               ? "bg-red-600/20 text-red-400"
//                               : "bg-zinc-600/20 text-zinc-400"
//                           }
//                         >
//                           {activity.type}
//                         </Badge>
//                       </TableCell>
//                       <TableCell className="text-white">
//                         {activity.description || "-"}
//                       </TableCell>
//                       <TableCell className="text-white">
//                         {activity.user?.name || "System"}
//                       </TableCell>
//                       <TableCell
//                         className={`text-right font-semibold ${
//                           activity.type === "DEDUCTION"
//                             ? "text-red-400"
//                             : "text-emerald-400"
//                         }`}
//                       >
//                         {activity.type === "DEDUCTION" ? "-" : "+"}Rp{" "}
//                         {Math.abs(activity.amount).toLocaleString()}
//                       </TableCell>
//                       <TableCell className="text-zinc-400">
//                         {format(
//                           new Date(activity.createdAt),
//                           "dd MMM yyyy HH:mm",
//                           { locale: id }
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>

//           {/* Pagination */}
//           {data && data.totalPages > 1 && (
//             <div className="py-4 px-6 border-t border-zinc-800">
//               <Pagination>
//                 <PaginationContent>
//                   <PaginationItem>
//                     <PaginationPrevious
//                       href="#"
//                       onClick={(e) => {
//                         e.preventDefault();
//                         if (page > 1) setPage(page - 1);
//                       }}
//                       className={
//                         page <= 1 ? "pointer-events-none opacity-50" : ""
//                       }
//                     />
//                   </PaginationItem>
//                   {Array.from(
//                     { length: Math.min(5, data.totalPages) },
//                     (_, i) => {
//                       let pageNum = i + 1;
//                       if (data.totalPages > 5 && page > 3) {
//                         pageNum = page - 3 + i;
//                         if (pageNum > data.totalPages - 4) {
//                           pageNum = data.totalPages - 4 + i;
//                         }
//                       }
//                       if (pageNum > data.totalPages) return null;
//                       return (
//                         <PaginationItem key={pageNum}>
//                           <PaginationLink
//                             href="#"
//                             onClick={(e) => {
//                               e.preventDefault();
//                               setPage(pageNum);
//                             }}
//                             isActive={page === pageNum}
//                           >
//                             {pageNum}
//                           </PaginationLink>
//                         </PaginationItem>
//                       );
//                     }
//                   )}
//                   <PaginationItem>
//                     <PaginationNext
//                       href="#"
//                       onClick={(e) => {
//                         e.preventDefault();
//                         if (page < data.totalPages) setPage(page + 1);
//                       }}
//                       className={
//                         page >= data.totalPages
//                           ? "pointer-events-none opacity-50"
//                           : ""
//                       }
//                     />
//                   </PaginationItem>
//                 </PaginationContent>
//               </Pagination>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  TrendingUp,
  Users,
  Package,
  Loader2,
  Calendar,
  Filter,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { id } from "date-fns/locale";
// Import Recharts components
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Komponen Date Range Picker sederhana
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

// Tipe activity (balance log) dari API
interface Activity {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
  user: {
    name: string;
  } | null;
}

interface Stats {
  totalVolume: number;
  totalTopups: number;
  activeUsers: number;
  totalSales: number;
}

interface FinanceResponse {
  data: Activity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: Stats;
}

export default function FinancePage() {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(
    {},
  );
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const limit = 20;

  // Build query params
  const queryParams = new URLSearchParams();
  if (dateRange.from) queryParams.set("from", dateRange.from);
  if (dateRange.to) queryParams.set("to", dateRange.to);
  if (typeFilter && typeFilter !== "ALL") queryParams.set("type", typeFilter);
  queryParams.set("page", page.toString());
  queryParams.set("limit", limit.toString());
  queryParams.set("sortBy", sortBy);
  queryParams.set("sortOrder", sortOrder);

  // Fetch finance stats & activities untuk TABEL
  const { data, isLoading, error, refetch } = useQuery<FinanceResponse>({
    queryKey: ["finance-stats", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/finance/stats?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  // Fetch data KHUSUS untuk GRAFIK (tanpa pagination, atau limit besar)
  // Kita gunakan params yang sama tapi limit=1000 untuk mendapatkan gambaran umum
  const chartQueryParams = new URLSearchParams(queryParams);
  chartQueryParams.set("limit", "1000"); // Ambil 1000 data terbaru untuk grafik
  chartQueryParams.delete("page"); // Hapus page agar mendapatkan data terakumulasi

  const { data: chartDataRaw, isLoading: isChartLoading } =
    useQuery<FinanceResponse>({
      queryKey: ["finance-chart", chartQueryParams.toString()],
      queryFn: async () => {
        const res = await fetch(
          `/api/finance/stats?${chartQueryParams.toString()}`,
        );
        if (!res.ok) throw new Error("Failed to fetch chart data");
        return res.json();
      },
      enabled:
        !!dateRange.from || !!dateRange.to || typeFilter !== "ALL" || true, // Selalu fetch
    });

  // Proses data untuk Grafik (Aggregation)
  const { lineChartData, barChartData } = useMemo(() => {
    if (!chartDataRaw?.data) return { lineChartData: [], barChartData: [] };

    const activities = chartDataRaw.data;

    // 1. Agregasi untuk Line Chart (Tren Harian)
    const dailyMap: Record<string, { income: number; expense: number }> = {};

    activities.forEach((act) => {
      const dateKey = format(new Date(act.createdAt), "dd MMM yyyy", {
        locale: id,
      });
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { income: 0, expense: 0 };

      // Logika sederhana: Deduction/Withdrawal = Expense, lainnya Income
      if (act.type === "DEDUCTION" || act.type === "WITHDRAWAL") {
        dailyMap[dateKey].expense += act.amount;
      } else {
        dailyMap[dateKey].income += act.amount;
      }
    });

    const lineData = Object.entries(dailyMap)
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date

    // 2. Agregasi untuk Bar Chart (Distribusi Tipe)
    const typeMap: Record<string, number> = {};
    activities.forEach((act) => {
      typeMap[act.type] = (typeMap[act.type] || 0) + act.amount;
    });

    const barData = Object.entries(typeMap).map(([type, amount]) => ({
      type,
      amount,
    }));

    return { lineChartData: lineData, barChartData: barData };
  }, [chartDataRaw]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const resetFilters = () => {
    setDateRange({});
    setTypeFilter("ALL");
    setPage(1);
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Finance Overview
        </h1>
        <p className="text-zinc-400">Platform financial statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-white">
                  Rp {(stats?.totalVolume || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-600/20">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Top-ups</p>
                <p className="text-2xl font-bold text-white">
                  Rp {(stats?.totalTopups || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-600/20">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.activeUsers || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-600/20">
                <Users className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Sales</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalSales || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-600/20">
                <Package className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-400">Date Range</Label>
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
            </div>
            <div className="w-full md:w-48 space-y-2">
              <Label className="text-zinc-400">Activity Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="TOPUP">Top-up</SelectItem>
                  <SelectItem value="DEDUCTION">Deduction</SelectItem>
                  <SelectItem value="EARNING">Earning</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="SALES_RELEASED">Sales Released</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="border-zinc-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Cash Flow Trend */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Cash Flow Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isChartLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : lineChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-zinc-500">
                No data to display
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      name="Expense"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Activity Distribution */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Activity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isChartLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : barChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-zinc-500">
                No data to display
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#71717a" fontSize={12} />
                    <YAxis
                      dataKey="type"
                      type="category"
                      stroke="#71717a"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(value: number) =>
                        `Rp ${value.toLocaleString()}`
                      }
                    />
                    <Bar
                      dataKey="amount"
                      name="Total Amount"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Financial Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableHead
                    className="text-zinc-400 cursor-pointer"
                    onClick={() => handleSort("type")}
                  >
                    Type <ArrowUpDown className="inline h-4 w-4 ml-1" />
                  </TableHead>
                  <TableHead className="text-zinc-400">Description</TableHead>
                  <TableHead className="text-zinc-400">User</TableHead>
                  <TableHead
                    className="text-zinc-400 text-right cursor-pointer"
                    onClick={() => handleSort("amount")}
                  >
                    Amount <ArrowUpDown className="inline h-4 w-4 ml-1" />
                  </TableHead>
                  <TableHead
                    className="text-zinc-400 cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    Date <ArrowUpDown className="inline h-4 w-4 ml-1" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-zinc-400"
                    >
                      No activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((activity) => (
                    <TableRow
                      key={activity.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell>
                        <Badge
                          className={
                            activity.type === "TOPUP"
                              ? "bg-emerald-600/20 text-emerald-400"
                              : activity.type === "EARNING"
                                ? "bg-blue-600/20 text-blue-400"
                                : activity.type === "DEDUCTION"
                                  ? "bg-red-600/20 text-red-400"
                                  : "bg-zinc-600/20 text-zinc-400"
                          }
                        >
                          {activity.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {activity.description || "-"}
                      </TableCell>
                      <TableCell className="text-white">
                        {activity.user?.name || "System"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          activity.type === "DEDUCTION"
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {activity.type === "DEDUCTION" ? "-" : "+"}Rp{" "}
                        {Math.abs(activity.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {format(
                          new Date(activity.createdAt),
                          "dd MMM yyyy HH:mm",
                          { locale: id },
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="py-4 px-6 border-t border-zinc-800">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={
                        page <= 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: Math.min(5, data.totalPages) },
                    (_, i) => {
                      let pageNum = i + 1;
                      if (data.totalPages > 5 && page > 3) {
                        pageNum = page - 3 + i;
                        if (pageNum > data.totalPages - 4) {
                          pageNum = data.totalPages - 4 + i;
                        }
                      }
                      if (pageNum > data.totalPages) return null;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(pageNum);
                            }}
                            isActive={page === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    },
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < data.totalPages) setPage(page + 1);
                      }}
                      className={
                        page >= data.totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
