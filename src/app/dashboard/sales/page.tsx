"use client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  History,
  DollarSign,
  Clock,
  CheckCircle,
  Gamepad2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

export default function SalesHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["sales-history"],
    queryFn: async () => {
      const res = await fetch("/api/sales");
      return res.json();
    },
    enabled: status === "authenticated" && session?.user?.role === "SUPPLIER",
  });

  useEffect(() => {
    if (
      status === "unauthenticated" ||
      (status === "authenticated" && session?.user?.role !== "SUPPLIER")
    ) {
      router.push("/dashboard/overview");
    }
  }, [status, session, router]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!session || session?.user?.role !== "SUPPLIER") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Sales History</h1>
        <p className="text-zinc-400">Track your account sales and earnings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20">
                <History className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Total Sales</p>
                <p className="text-xl font-bold text-white">
                  {data?.summary?.totalSales || 0}
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
                <p className="text-xs text-zinc-400">Total Earnings</p>
                <p className="text-xl font-bold text-white">
                  Rp {data?.summary?.totalEarnings?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-600/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Pending Earnings</p>
                <p className="text-xl font-bold text-white">
                  Rp {data?.summary?.pendingEarnings?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600/20">
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Pending Count</p>
                <p className="text-xl font-bold text-white">
                  {data?.summary?.pendingCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Sales Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : data?.sales?.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No sales yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Account
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Game
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Buyer
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Amount
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-400 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.sales?.map((sale: any) => (
                    <tr
                      key={sale.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-white">
                          {sale.account.publicId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-zinc-300">
                            {sale.account.game.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-zinc-300">{sale.reseller.name}</p>
                          <p className="text-xs text-zinc-500">
                            {sale.reseller.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-emerald-400">
                          Rp {sale.basePrice.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sale.pendingBalance?.status === "PENDING" ? (
                          <Badge className="bg-amber-600/20 text-amber-400 hover:bg-amber-600/30">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30">
                            <CheckCircle className="w-3 h-3 mr-1" /> Released
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-zinc-400">
                          {formatDate(sale.createdAt)}
                        </span>
                        {sale.pendingBalance?.status === "PENDING" && (
                          <p className="text-xs text-amber-400">
                            Releases:{" "}
                            {formatDate(sale.pendingBalance.releaseDate)}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
