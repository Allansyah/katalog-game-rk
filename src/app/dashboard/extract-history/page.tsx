'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Eye, 
  Copy, 
  Check, 
  Loader2, 
  Package, 
  History,
  RefreshCw,
  EyeOff,
  AlertTriangle,
  Gamepad2,
  Crown,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ExtractedAccount {
  id: string;
  createdAt: string;
  basePrice: number;
  platformFee: number;
  finalPrice: number;
  account: {
    id: string;
    publicId: string;
    game: { id: string; name: string; code: string };
    server: { id: string; name: string } | null;
    level: number | null;
    diamond: number;
    characters: { id: string; name: string; rarity?: number }[];
    weapons: { id: string; name: string; rarity?: number }[];
    status: string;
  };
  credentials?: {
    username: string;
    password: string;
    email?: string;
    emailPassword?: string;
    secretQuestion?: string;
    secretAnswer?: string;
    firstName?: string;
    lastName?: string;
    accountCountry?: string;
    dateOfBirth?: string;
    additionalNote?: string;
  } | null;
}

export default function ExtractHistoryPage() {
  const [showCredentials, setShowCredentials] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ExtractedAccount | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());

  // Fetch extract history
  const { data, isLoading, refetch, isRefetching } = useQuery<{ transactions: ExtractedAccount[] }>({
    queryKey: ['extract-history'],
    queryFn: async () => {
      const res = await fetch('/api/extract-history');
      if (!res.ok) throw new Error('Failed to fetch extract history');
      return res.json();
    },
  });

  // Fetch credentials for selected transaction
  const { data: credentialData, isLoading: isLoadingCredentials } = useQuery<{
    transaction: ExtractedAccount;
  }>({
    queryKey: ['extract-credentials', selectedTransaction?.id],
    queryFn: async () => {
      const res = await fetch(`/api/extract-history/${selectedTransaction?.id}`);
      if (!res.ok) throw new Error('Failed to fetch credentials');
      return res.json();
    },
    enabled: !!selectedTransaction?.id && showCredentials,
  });

  const handleViewCredentials = (transaction: ExtractedAccount) => {
    setSelectedTransaction(transaction);
    setShowCredentials(true);
    setShowPasswords(new Set());
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const transactions = data?.transactions || [];
  const credentials = credentialData?.transaction?.credentials;

  // Calculate totals
  const totalSpent = transactions.reduce((sum, tx) => sum + tx.finalPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Extract History</h1>
          <p className="text-zinc-400">View your extracted accounts and credentials</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="border-zinc-700 text-zinc-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-900/30 rounded-lg">
                <Package className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{transactions.length}</div>
                <div className="text-sm text-zinc-400">Accounts Extracted</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-900/30 rounded-lg">
                <Gamepad2 className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {new Set(transactions.map(tx => tx.account.game.id)).size}
                </div>
                <div className="text-sm text-zinc-400">Games</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-900/30 rounded-lg">
                <History className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">Rp {totalSpent.toLocaleString()}</div>
                <div className="text-sm text-zinc-400">Total Spent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Your Extracted Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">No accounts extracted yet</p>
              <p className="text-zinc-500 text-sm">
                Go to Extract Account to purchase your first account
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-lg border bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Account Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-white font-medium">{tx.account.publicId}</span>
                        <Badge className="bg-emerald-600">{tx.account.game.name}</Badge>
                        {tx.account.server && (
                          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                            {tx.account.server.name}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500">Level:</span>
                          <span className="text-zinc-300 ml-1">{tx.account.level || '-'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Diamond:</span>
                          <span className="text-emerald-400 ml-1">{tx.account.diamond.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Price:</span>
                          <span className="text-zinc-300 ml-1">Rp {tx.finalPrice.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Extracted:</span>
                          <span className="text-zinc-300 ml-1">
                            {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Characters */}
                      {tx.account.characters.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-zinc-500">Characters: </span>
                          <span className="text-xs text-zinc-400">
                            {tx.account.characters.map(c => c.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* View Credentials Button */}
                    <Button
                      onClick={() => handleViewCredentials(tx)}
                      className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Credentials
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credentials Modal */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Account Credentials
            </DialogTitle>
            <DialogDescription className="text-cyan-400">
              ✓ Credentials saved! View them anytime in Extract History.
            </DialogDescription>
          </DialogHeader>

          {isLoadingCredentials ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : credentials ? (
            <div className="space-y-4">
              {/* Account Info */}
              <div className="p-3 bg-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-400">Account ID</p>
                <p className="font-mono text-white">{selectedTransaction?.account.publicId}</p>
              </div>

              {/* Game Info */}
              <div className="p-3 bg-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-400">Game</p>
                <p className="text-white">{selectedTransaction?.account.game.name}</p>
              </div>

              {/* Credentials */}
              <div className="space-y-3">
                {/* Username */}
                <CredentialField
                  label="Username"
                  value={credentials.username}
                  copied={copied}
                  onCopy={copyToClipboard}
                />

                {/* Password */}
                <CredentialField
                  label="Password"
                  value={credentials.password}
                  copied={copied}
                  onCopy={copyToClipboard}
                  isPassword
                  showPassword={showPasswords.has('Password')}
                  onTogglePassword={() => togglePasswordVisibility('Password')}
                />

                {/* Email */}
                {credentials.email && (
                  <CredentialField
                    label="Email"
                    value={credentials.email}
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                )}

                {/* Email Password */}
                {credentials.emailPassword && (
                  <CredentialField
                    label="Email Password"
                    value={credentials.emailPassword}
                    copied={copied}
                    onCopy={copyToClipboard}
                    isPassword
                    showPassword={showPasswords.has('Email Password')}
                    onTogglePassword={() => togglePasswordVisibility('Email Password')}
                  />
                )}

                {/* Secret Question & Answer */}
                {credentials.secretQuestion && (
                  <CredentialField
                    label="Secret Question"
                    value={credentials.secretQuestion}
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                )}
                {credentials.secretAnswer && (
                  <CredentialField
                    label="Secret Answer"
                    value={credentials.secretAnswer}
                    copied={copied}
                    onCopy={copyToClipboard}
                    isPassword
                    showPassword={showPasswords.has('Secret Answer')}
                    onTogglePassword={() => togglePasswordVisibility('Secret Answer')}
                  />
                )}

                {/* Personal Info */}
                {(credentials.firstName || credentials.lastName) && (
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-400">Name</p>
                    <p className="text-white">{[credentials.firstName, credentials.lastName].filter(Boolean).join(' ')}</p>
                  </div>
                )}

                {credentials.accountCountry && (
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-400">Account Country</p>
                    <p className="text-white">{credentials.accountCountry}</p>
                  </div>
                )}

                {credentials.dateOfBirth && (
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-400">Date of Birth</p>
                    <p className="text-white">{credentials.dateOfBirth}</p>
                  </div>
                )}

                {/* Additional Note */}
                {credentials.additionalNote && (
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-400">Additional Note</p>
                    <p className="text-white whitespace-pre-wrap">{credentials.additionalNote}</p>
                  </div>
                )}
              </div>

              {/* Transaction Summary */}
              {selectedTransaction && (
                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex justify-between text-sm pt-2 border-zinc-700">
                    <span className="text-zinc-300">Total Paid:</span>
                    <span className="text-white font-medium">Rp {selectedTransaction.finalPrice.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2">
                    Extracted At: <span className="text-white">
                      {new Date(selectedTransaction.createdAt).toLocaleString('id-ID')}
                    </span>
                  </p>
                </div>
              )}

              <Button
                onClick={() => {
                  setShowCredentials(false);
                  setShowPasswords(new Set());
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              Failed to load credentials
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Credential Field Component
function CredentialField({
  label,
  value,
  copied,
  onCopy,
  isPassword = false,
  showPassword = false,
  onTogglePassword,
}: {
  label: string;
  value: string;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}) {
  return (
    <div className="p-3 bg-zinc-800 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">{label}</p>
        <div className="flex gap-1">
          {isPassword && onTogglePassword && (
            <Button variant="ghost" size="sm" onClick={onTogglePassword}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(value, label)}
          >
            {copied === label ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="font-mono text-white break-all">
        {isPassword && !showPassword ? '••••••••••••' : value}
      </p>
    </div>
  );
}
