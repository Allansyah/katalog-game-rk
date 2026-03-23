"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string;
}

interface ActivityLogsResponse {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    actions: string[];
  };
}

// Action labels and colors
const actionConfig: Record<string, { label: string; color: string }> = {
  LOGIN: { label: "Login", color: "bg-green-500" },
  LOGOUT: { label: "Logout", color: "bg-gray-500" },
  LOGIN_FAILED: { label: "Login Failed", color: "bg-red-500" },
  ACCOUNT_CREATE: { label: "Create Account", color: "bg-blue-500" },
  ACCOUNT_UPDATE: { label: "Update Account", color: "bg-blue-500" },
  ACCOUNT_EXTRACT: { label: "Extract Account", color: "bg-purple-500" },
  TOPUP_REQUEST: { label: "Topup Request", color: "bg-yellow-500" },
  WITHDRAW_REQUEST: { label: "Withdraw Request", color: "bg-yellow-500" },
  TRANSFER_BALANCE: { label: "Transfer Balance", color: "bg-purple-500" },
  PASSWORD_CHANGE: { label: "Change Password", color: "bg-orange-500" },
  PROFILE_UPDATE: { label: "Update Profile", color: "bg-blue-500" },
};

// Mapping aksi yang diizinkan per Role (berdasarkan Sidebar)
const ROLE_ALLOWED_ACTIONS: Record<string, string[]> = {
  SUPER_ADMIN: Object.keys(actionConfig), // Super Admin lihat semua
  SUPPLIER: [
    "LOGIN",
    "LOGOUT",
    "LOGIN_FAILED",
    "PASSWORD_CHANGE",
    "PROFILE_UPDATE",
    "TOPUP_REQUEST",
    "WITHDRAW_REQUEST",
    "ACCOUNT_CREATE", // Akses My Accounts
    "ACCOUNT_UPDATE", // Akses My Accounts
    "ACCOUNT_EXTRACT", // Akses Extract Account
  ],
  RESELLER: [
    "LOGIN",
    "LOGOUT",
    "LOGIN_FAILED",
    "PASSWORD_CHANGE",
    "PROFILE_UPDATE",
    "TOPUP_REQUEST",
    "WITHDRAW_REQUEST",
    "ACCOUNT_EXTRACT", // Akses Extract Account
  ],
};

function ActionBadge({ action }: { action: string }) {
  const config = actionConfig[action] || {
    label: action,
    color: "bg-gray-500",
  };
  return (
    <Badge className={`${config.color} text-white text-xs`}>
      {config.label}
    </Badge>
  );
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateTime(dateString);
}

export default function MyActivityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    actions: [] as string[],
  });

  // Filter state
  const [selectedAction, setSelectedAction] = useState<string>("all");

  // Check authorization
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch activity logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (selectedAction !== "all") params.set("action", selectedAction);

      const response = await fetch(`/api/my-activity?${params.toString()}`);
      if (response.ok) {
        const data: ActivityLogsResponse = await response.json();
        setLogs(data.logs);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
        setFilters(data.filters);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchLogs();
    }
  }, [session, pagination.page, selectedAction]);

  // Filter daftar aksi berdasarkan role pengguna
  const allowedActions = useMemo(() => {
    const userRole = session?.user?.role as string | undefined;
    if (!userRole) return [];
    return ROLE_ALLOWED_ACTIONS[userRole] || [];
  }, [session]);

  // Filter daftar yang berasal dari API agar hanya menampilkan yang diizinkan
  const filteredActionOptions = useMemo(() => {
    return filters.actions.filter((action) => allowedActions.includes(action));
  }, [filters.actions, allowedActions]);

  if (status === "loading" || !session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            My Activity
          </h1>
          <p className="text-zinc-400 mt-1">
            View your recent activities and account history
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Actions</SelectItem>
                {filteredActionOptions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {actionConfig[action]?.label || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Activity History</span>
            <span className="text-sm font-normal text-zinc-400">
              {pagination.total} total records
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No activity records found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  {/* Icon */}
                  <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-zinc-400" />
                  </div>

                  {/* Activity Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ActionBadge action={log.action} />
                      {log.entityName && (
                        <span className="text-zinc-400 text-sm truncate">
                          • {log.entityName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                      {log.ipAddress && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm text-zinc-400">
                      {formatTimeAgo(log.createdAt)}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {formatDateTime(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
              <div className="text-sm text-zinc-400">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="border-zinc-700 text-zinc-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="border-zinc-700 text-zinc-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
