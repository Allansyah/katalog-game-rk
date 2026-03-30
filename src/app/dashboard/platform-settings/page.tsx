"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Percent, Loader2, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PlatformSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [platformFee, setPlatformFee] = useState("");

  // Debug: Log session status
  console.log("Session status:", status);
  console.log("Session user:", session?.user);
  console.log("Is SUPER_ADMIN:", session?.user?.role === "SUPER_ADMIN");

  // Fetch platform settings
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      console.log("Fetching platform settings...");
      try {
        const res = await fetch("/api/settings/platform");
        console.log("Response status:", res.status);

        if (!res.ok) {
          const errorData = await res.json();
          console.error("API Error:", errorData);
          throw new Error(errorData.error || "Failed to fetch settings");
        }

        const data = await res.json();
        console.log("Fetched data:", data);

        // Handle different response structures
        let feeValue = "20"; // Default value

        if (data.settings?.platformFee !== undefined) {
          feeValue = data.settings.platformFee.toString();
        } else if (data.platformFee !== undefined) {
          feeValue = data.platformFee.toString();
        } else if (data.fee !== undefined) {
          feeValue = data.fee.toString();
        }

        console.log("Setting platformFee to:", feeValue);
        setPlatformFee(feeValue);

        return data;
      } catch (err) {
        console.error("Fetch error:", err);
        throw err;
      }
    },
    enabled: status === "authenticated", // Hapus kondisi role dari sementara untuk debug
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: async (platformFee: number) => {
      console.log("Updating platform fee to:", platformFee);
      const res = await fetch("/api/settings/platform", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformFee }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Update error:", error);
        throw new Error(error.error || "Failed to update settings");
      }

      const result = await res.json();
      console.log("Update success:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Platform settings updated");
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast.error(error.message);
    },
  });

  // Redirect jika bukan SUPER_ADMIN
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN") {
      console.log("Not SUPER_ADMIN, redirecting...");
      router.push("/dashboard/overview");
    }
  }, [status, session, router]);

  const handleSave = () => {
    const fee = parseFloat(platformFee);
    if (isNaN(fee) || fee < 0 || fee > 100) {
      toast.error("Platform fee must be between 0 and 100");
      return;
    }
    updateMutation.mutate(fee);
  };

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
          <p className="text-zinc-400">Configure platform-wide settings</p>
        </div>
        <Card className="bg-zinc-900 border-zinc-800 max-w-xl">
          <CardContent className="py-8">
            <div className="text-center text-red-400">
              <p className="mb-4">Error loading settings: {error.message}</p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show if not SUPER_ADMIN
  if (session?.user?.role !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-zinc-400">Configure platform-wide settings</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 max-w-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Percent className="w-5 h-5" /> Platform Fee
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Set the platform fee percentage applied to all transactions. This
            fee is added on top of the base price when a reseller purchases an
            account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Fee Percentage (%)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 w-32"
                  />
                  <span className="text-zinc-400">%</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Example: If base price is Rp 20,000 and fee is{" "}
                  {platformFee || 0}%, buyer pays Rp{" "}
                  {(
                    20000 +
                    (20000 * (parseFloat(platformFee) || 0)) / 100
                  ).toLocaleString()}
                </p>
              </div>

              <div className="bg-zinc-800 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">
                  Price Calculation Example
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Base Price:</span>
                    <span className="text-white">Rp 20,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">
                      Platform Fee ({platformFee || 0}%):
                    </span>
                    <span className="text-amber-400">
                      Rp{" "}
                      {(
                        (20000 * (parseFloat(platformFee) || 0)) /
                        100
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-700 pt-1 mt-2">
                    <span className="text-zinc-300">Buyer Pays:</span>
                    <span className="text-emerald-400 font-semibold">
                      Rp{" "}
                      {(
                        20000 +
                        (20000 * (parseFloat(platformFee) || 0)) / 100
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
