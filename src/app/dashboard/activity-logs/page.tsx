'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  User,
  Clock,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Monitor,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
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
    entityTypes: string[];
    actions: string[];
  };
}

// Action labels and colors
const actionConfig: Record<string, { label: string; color: string }> = {
  // Authentication
  LOGIN: { label: 'Login', color: 'bg-green-500' },
  LOGOUT: { label: 'Logout', color: 'bg-gray-500' },
  LOGIN_FAILED: { label: 'Login Failed', color: 'bg-red-500' },
  
  // User Management
  USER_CREATE: { label: 'Create User', color: 'bg-blue-500' },
  USER_UPDATE: { label: 'Update User', color: 'bg-blue-500' },
  USER_DELETE: { label: 'Delete User', color: 'bg-red-500' },
  USER_BAN: { label: 'Ban User', color: 'bg-red-500' },
  USER_UNBAN: { label: 'Unban User', color: 'bg-green-500' },
  
  // Account Management
  ACCOUNT_CREATE: { label: 'Create Account', color: 'bg-blue-500' },
  ACCOUNT_UPDATE: { label: 'Update Account', color: 'bg-blue-500' },
  ACCOUNT_DELETE: { label: 'Delete Account', color: 'bg-red-500' },
  ACCOUNT_EXTRACT: { label: 'Extract Account', color: 'bg-purple-500' },
  
  // Game & Character
  GAME_CREATE: { label: 'Create Game', color: 'bg-blue-500' },
  GAME_UPDATE: { label: 'Update Game', color: 'bg-blue-500' },
  GAME_DELETE: { label: 'Delete Game', color: 'bg-red-500' },
  CHARACTER_CREATE: { label: 'Create Character', color: 'bg-blue-500' },
  CHARACTER_UPDATE: { label: 'Update Character', color: 'bg-blue-500' },
  CHARACTER_DELETE: { label: 'Delete Character', color: 'bg-red-500' },
  
  // Tier Management
  TIER_CREATE: { label: 'Create Tier', color: 'bg-blue-500' },
  TIER_UPDATE: { label: 'Update Tier', color: 'bg-blue-500' },
  TIER_DELETE: { label: 'Delete Tier', color: 'bg-red-500' },
  
  // Finance
  TOPUP_REQUEST: { label: 'Topup Request', color: 'bg-yellow-500' },
  TOPUP_APPROVE: { label: 'Approve Topup', color: 'bg-green-500' },
  TOPUP_REJECT: { label: 'Reject Topup', color: 'bg-red-500' },
  WITHDRAW_REQUEST: { label: 'Withdraw Request', color: 'bg-yellow-500' },
  WITHDRAW_APPROVE: { label: 'Approve Withdraw', color: 'bg-green-500' },
  WITHDRAW_REJECT: { label: 'Reject Withdraw', color: 'bg-red-500' },
  TRANSFER_BALANCE: { label: 'Transfer Balance', color: 'bg-purple-500' },
  
  // Settings
  PLATFORM_SETTINGS_UPDATE: { label: 'Update Settings', color: 'bg-orange-500' },
  
  // Payment Methods & Packages
  PAYMENT_METHOD_CREATE: { label: 'Create Payment Method', color: 'bg-blue-500' },
  PAYMENT_METHOD_UPDATE: { label: 'Update Payment Method', color: 'bg-blue-500' },
  PAYMENT_METHOD_DELETE: { label: 'Delete Payment Method', color: 'bg-red-500' },
  TOPUP_PACKAGE_CREATE: { label: 'Create Package', color: 'bg-blue-500' },
  TOPUP_PACKAGE_UPDATE: { label: 'Update Package', color: 'bg-blue-500' },
  TOPUP_PACKAGE_DELETE: { label: 'Delete Package', color: 'bg-red-500' },
  
  // Profile
  PASSWORD_CHANGE: { label: 'Change Password', color: 'bg-orange-500' },
  PROFILE_UPDATE: { label: 'Update Profile', color: 'bg-blue-500' },
};

function ActionBadge({ action }: { action: string }) {
  const config = actionConfig[action] || { label: action, color: 'bg-gray-500' };
  return (
    <Badge className={`${config.color} text-white text-xs`}>
      {config.label}
    </Badge>
  );
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateTime(dateString);
}

export default function ActivityLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    entityTypes: [] as string[],
    actions: [] as string[],
  });
  
  // Filter state
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detail modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Check authorization
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard/overview');
    }
  }, [status, session, router]);

  // Fetch activity logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (selectedAction !== 'all') params.set('action', selectedAction);
      if (selectedEntityType !== 'all') params.set('entityType', selectedEntityType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/activity-logs?${params.toString()}`);
      if (response.ok) {
        const data: ActivityLogsResponse = await response.json();
        setLogs(data.logs);
        setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
        setFilters(data.filters);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      fetchLogs();
    }
  }, [session, pagination.page, selectedAction, selectedEntityType, startDate, endDate]);

  // Filter by search term (client-side)
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.user?.name?.toLowerCase().includes(search) ||
      log.user?.email?.toLowerCase().includes(search) ||
      log.entityName?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search)
    );
  });

  if (status === 'loading' || !session || session.user.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            Activity Logs
          </h1>
          <p className="text-zinc-400 mt-1">
            Track all user activities and system events
          </p>
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Action filter */}
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Actions</SelectItem>
                {filters.actions.map(action => (
                  <SelectItem key={action} value={action}>
                    {actionConfig[action]?.label || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Entity type filter */}
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Types</SelectItem>
                {filters.entityTypes.map(type => (
                  <SelectItem key={type} value={type || ''}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range */}
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="End Date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Recent Activities</span>
            <span className="text-sm font-normal text-zinc-400">
              {pagination.total} total records
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  {/* User Avatar */}
                  <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    {log.user ? (
                      <span className="text-sm font-medium text-white">
                        {log.user.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User className="h-5 w-5 text-zinc-500" />
                    )}
                  </div>

                  {/* Activity Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white truncate">
                        {log.user?.name || 'Unknown User'}
                      </span>
                      <ActionBadge action={log.action} />
                      {log.entityName && (
                        <span className="text-zinc-400 text-sm truncate">
                          • {log.entityName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user?.role || 'Unknown'}
                      </span>
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

                  {/* View Button */}
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Eye className="h-4 w-4 text-zinc-400" />
                  </Button>
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
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="border-zinc-700 text-zinc-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              Activity Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              {/* Action */}
              <div>
                <label className="text-xs text-zinc-500 uppercase">Action</label>
                <div className="mt-1">
                  <ActionBadge action={selectedLog.action} />
                </div>
              </div>

              {/* User */}
              <div>
                <label className="text-xs text-zinc-500 uppercase">User</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    {selectedLog.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-medium">{selectedLog.user?.name || 'Unknown'}</div>
                    <div className="text-sm text-zinc-400">{selectedLog.user?.email}</div>
                  </div>
                </div>
              </div>

              {/* Entity */}
              {selectedLog.entityType && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Entity</label>
                  <div className="mt-1 text-sm">
                    <span className="text-zinc-400">{selectedLog.entityType}:</span>{' '}
                    <span className="text-white">{selectedLog.entityName || selectedLog.entityId}</span>
                  </div>
                </div>
              )}

              {/* Details */}
              {selectedLog.details && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Details</label>
                  <pre className="mt-1 p-3 bg-zinc-800 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
                  </pre>
                </div>
              )}

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    IP Address
                  </label>
                  <div className="mt-1 text-sm text-white">
                    {selectedLog.ipAddress || 'Unknown'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Timestamp
                  </label>
                  <div className="mt-1 text-sm text-white">
                    {formatDateTime(selectedLog.createdAt)}
                  </div>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    User Agent
                  </label>
                  <div className="mt-1 text-xs text-zinc-400 break-all">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
