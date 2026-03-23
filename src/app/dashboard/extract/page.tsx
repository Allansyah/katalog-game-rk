"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Crown,
  Gift,
  Shield,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Interface yang diperluas sesuai data dari InventoryPage
interface AccountInfo {
  id: string;
  publicId: string;
  game: { id: string; name: string; code: string };
  level: number | null;
  diamond: number;
  serverId: string | null;
  server: { id: string; name: string; code: string | null } | null;
  gender: string | null;
  status: string;
  characters: {
    id: string;
    name: string;
    rarity: number | null;
    quantity: number;
  }[];
  weapons: {
    id: string;
    name: string;
    rarity: number | null;
    quantity: number;
  }[];
}

interface Pricing {
  basePrice: number;
  platformFee: number;
  platformFeePercent: number;
  basePlatformFee: number;
  tierDiscountPercent: number;
  finalPrice: number;
  savings: number;
  originalPlatformFee: number;
  balance: number;
  sufficient: boolean;
  isOwner?: boolean;
  tierName?: string | null;
}

interface Credentials {
  username: string;
  password: string;
  email?: string;
}

interface Transaction {
  id: string;
  basePrice: number;
  platformFee: number;
  platformFeePercent: number;
  savings: number;
  finalPrice: number;
  balanceAfter: number;
  isOwner?: boolean;
}

interface ExtractResponse {
  account: AccountInfo;
  pricing: Pricing;
  credentials?: Credentials;
  transaction?: Transaction;
}

export default function ExtractPage() {
  const [accountId, setAccountId] = useState("");
  const [searchId, setSearchId] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Query otomatis berjalan saat searchId berubah
  const {
    data: priceData,
    isLoading: isLoadingPrice,
    error: priceError,
  } = useQuery<ExtractResponse>({
    queryKey: ["price-inquiry", searchId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${searchId}/extract`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to get price");
      }
      return res.json();
    },
    enabled: !!searchId, // hanya fetch jika ada ID
  });

  const extractMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/accounts/${searchId}/extract`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to extract account");
      }
      return res.json() as Promise<ExtractResponse>;
    },
    onSuccess: (data) => {
      if (data.transaction?.isOwner) {
        toast.success("Your account retrieved successfully!");
      } else {
        toast.success("Account extracted successfully!");
      }
      setShowCredentials(true);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSearch = () => {
    if (!accountId.trim()) {
      toast.error("Please enter an Account ID");
      return;
    }
    setSearchId(accountId.trim());
  };

  const handleExtract = () => {
    extractMutation.mutate();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const credentials = extractMutation.data?.credentials;
  const transaction = extractMutation.data?.transaction;
  const isOwner = priceData?.pricing?.isOwner || transaction?.isOwner;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Extract Account
        </h1>
        <p className="text-zinc-400">
          Enter an Account ID to check price and purchase
        </p>
      </div>

      {/* Search Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Price Inquiry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Enter Account ID (e.g., WW-1704708578-X29F)"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-zinc-800 border-zinc-700 pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoadingPrice}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoadingPrice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Check Price"
              )}
            </Button>
          </div>

          {/* Error */}
          {priceError && (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
              {priceError instanceof Error
                ? priceError.message
                : "Failed to get price"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Details & Pricing */}
      {priceData && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Info */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Account Details
                {isOwner && (
                  <Badge className="bg-amber-600">
                    <Crown className="h-3 w-3 mr-1" />
                    Your Account
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Account ID</span>
                <span className="font-mono text-white">
                  {priceData.account.publicId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Game</span>
                <Badge className="bg-emerald-600">
                  {priceData.account.game.name}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Level</span>
                <span className="text-white">
                  {priceData.account.level || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Diamond</span>
                <span className="text-emerald-400">
                  {priceData.account.diamond.toLocaleString()}
                </span>
              </div>
              {/* Server (object) */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Server</span>
                <span className="text-white">
                  {priceData.account.server?.name || "-"}
                </span>
              </div>
              {/* Gender */}
              {priceData.account.gender && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Gender</span>
                  <span className="text-white">{priceData.account.gender}</span>
                </div>
              )}

              {/* Characters */}
              {priceData.account.characters.length > 0 && (
                <div className="pt-4 border-t border-zinc-800">
                  <Label className="text-zinc-400">Characters</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {priceData.account.characters.map((char) => (
                      <Badge
                        key={char.id}
                        variant="outline"
                        className="border-zinc-700"
                      >
                        {char.name}
                        {char.rarity && (
                          <span className="ml-1 text-yellow-400">
                            ★{char.rarity}
                          </span>
                        )}
                        {char.quantity > 1 && (
                          <span className="ml-1 text-xs text-zinc-400">
                            x{char.quantity}
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Weapons */}
              {priceData.account.weapons.length > 0 && (
                <div className="pt-4 border-t border-zinc-800">
                  <Label className="text-zinc-400">Weapons</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {priceData.account.weapons.map((weapon) => (
                      <Badge
                        key={weapon.id}
                        variant="outline"
                        className="border-zinc-700"
                      >
                        {weapon.name}
                        {weapon.rarity && (
                          <span className="ml-1 text-yellow-400">
                            ★{weapon.rarity}
                          </span>
                        )}
                        {weapon.quantity > 1 && (
                          <span className="ml-1 text-xs text-zinc-400">
                            x{weapon.quantity}
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Pricing
                {priceData.pricing.tierName && !isOwner && (
                  <Badge className="bg-purple-600">
                    <Shield className="h-3 w-3 mr-1" />
                    {priceData.pricing.tierName}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwner ? (
                <>
                  {/* Owner - Free Extraction */}
                  <div className="p-6 bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-700/50 rounded-lg text-center">
                    <Gift className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-emerald-400 mb-1">
                      FREE Extraction
                    </p>
                    <p className="text-sm text-zinc-400">
                      This is your own account. You can retrieve it without any
                      charges.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <span className="text-white font-semibold">
                      Final Price
                    </span>
                    <span className="text-2xl font-bold text-emerald-400">
                      FREE
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Your Balance</span>
                    <span className="text-white">
                      Rp {priceData.pricing.balance.toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">
                      (unchanged)
                    </span>
                  </div>

                  <Button
                    onClick={handleExtract}
                    disabled={extractMutation.isPending}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                  >
                    {extractMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        Retrieve My Account (Free)
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {priceData.pricing.savings > 0 && (
                    <div className="p-3 bg-emerald-900/20 border border-emerald-900/50 rounded-lg flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 text-sm">
                        You save Rp {priceData.pricing.savings.toLocaleString()}{" "}
                        with {priceData.pricing.tierName} tier!
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <span className="text-white font-semibold">
                      Final Price
                    </span>
                    <span className="text-2xl font-bold text-emerald-400">
                      Rp {priceData.pricing.finalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Your Balance</span>
                    <span className="text-white">
                      Rp {priceData.pricing.balance.toLocaleString()}
                    </span>
                  </div>

                  {!priceData.pricing.sufficient && (
                    <div className="p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-400 font-medium">
                          Insufficient Balance
                        </p>
                        <p className="text-yellow-400/80 text-sm">
                          You need Rp{" "}
                          {(
                            priceData.pricing.finalPrice -
                            priceData.pricing.balance
                          ).toLocaleString()}{" "}
                          more
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleExtract}
                    disabled={
                      !priceData.pricing.sufficient || extractMutation.isPending
                    }
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {extractMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Extract Account"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Credentials Modal */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Account Credentials
            </DialogTitle>
            <DialogDescription
              className={isOwner ? "text-emerald-400" : "text-cyan-400"}
            >
              {isOwner
                ? "✓ Your account credentials retrieved successfully!"
                : "✓ Credentials saved! View them anytime in Extract History."}
            </DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-400">Account ID</p>
                <p className="font-mono text-white">
                  {extractMutation.data?.account?.publicId}
                </p>
                {isOwner && (
                  <Badge className="bg-amber-600 mt-2">
                    <Crown className="h-3 w-3 mr-1" />
                    Your Account
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-400">Username</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(credentials.username, "Username")
                      }
                    >
                      {copied === "Username" ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="font-mono text-white break-all">
                    {credentials.username}
                  </p>
                </div>

                <div className="p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-400">Password</p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(credentials.password, "Password")
                        }
                      >
                        {copied === "Password" ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="font-mono text-white break-all">
                    {showPassword ? credentials.password : "••••••••••••"}
                  </p>
                </div>

                {credentials.email && (
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-400">Email</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(credentials.email!, "Email")
                        }
                      >
                        {copied === "Email" ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="font-mono text-white break-all">
                      {credentials.email}
                    </p>
                  </div>
                )}
              </div>

              {transaction && (
                <div className="pt-4 border-t border-zinc-800 space-y-1">
                  {isOwner ? (
                    <>
                      <p className="text-sm text-zinc-400">
                        Status:{" "}
                        <span className="text-emerald-400">
                          Retrieved (Free)
                        </span>
                      </p>
                      <p className="text-sm text-zinc-400">
                        Balance:{" "}
                        <span className="text-white">
                          Rp {transaction.balanceAfter.toLocaleString()}
                        </span>
                        <span className="text-xs text-zinc-500 ml-1">
                          (unchanged)
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm pt-2 border-t border-zinc-700">
                        <span className="text-zinc-300">Total Paid:</span>
                        <span className="text-white font-medium">
                          Rp {transaction.finalPrice.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        Balance After:{" "}
                        <span className="text-emerald-400">
                          Rp {transaction.balanceAfter.toLocaleString()}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              )}

              <Button
                onClick={() => {
                  setShowCredentials(false);
                  setShowPassword(false);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isOwner ? "Close" : "I've Saved My Credentials"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
