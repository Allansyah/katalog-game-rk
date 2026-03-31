"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Shield,
  Wallet,
  Calendar,
  Loader2,
  Save,
  Key,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  totalSpent: number;
  createdAt: string;
  tier: {
    name: string;
    discountPercent: number;
    color: string | null;
  } | null;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Profile updated successfully");
      updateSession({ name: data.user.name });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }
      if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters");
      }

      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Set name when profile loads
  useState(() => {
    if (profileData?.user?.name) {
      setName(profileData.user.name);
    }
  });

  const profile = profileData?.user as UserProfile | undefined;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-600/20 text-red-400";
      case "SUPPLIER":
        return "bg-blue-600/20 text-blue-400";
      case "RESELLER":
        return "bg-emerald-600/20 text-emerald-400";
      default:
        return "bg-zinc-600/20 text-zinc-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          My Profile
        </h1>
        <p className="text-zinc-400">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-lg">Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <User className="h-10 w-10 text-emerald-400" />
              </div>
            </div>

            {/* Name */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">{profile?.name}</h3>
              <p className="text-zinc-400 text-sm">{profile?.email}</p>
            </div>

            {/* Role Badge */}
            <div className="flex justify-center">
              <Badge className={getRoleBadgeColor(profile?.role || "")}>
                {profile?.role?.replace("_", " ")}
              </Badge>
            </div>

            {/* Tier */}
            {profile?.tier && (
              <div className="flex justify-center">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{
                    backgroundColor: `${profile.tier.color || "#CD7F32"}20`,
                    color: profile.tier.color || "#CD7F32",
                  }}
                >
                  <Star className="h-4 w-4" />
                  {profile.tier.name} ({profile.tier.discountPercent}% discount)
                </div>
              </div>
            )}

            <Separator className="bg-zinc-800" />

            {/* Stats */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Balance
                </span>
                <span className="text-emerald-400 font-semibold">
                  Rp {profile?.balance?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Total Spent
                </span>
                <span className="text-white">
                  Rp {profile?.totalSpent?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined
                </span>
                <span className="text-white text-xs">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Update Profile */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Update Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfileMutation.mutate(name);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-zinc-400">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Email</Label>
                  <Input
                    value={profile?.email || ""}
                    disabled
                    className="bg-zinc-800 border-zinc-700 text-zinc-500"
                  />
                  <p className="text-xs text-zinc-500">
                    Email cannot be changed
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={
                    updateProfileMutation.isPending || name === profile?.name
                  }
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  changePasswordMutation.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-zinc-400">Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-zinc-800 border-zinc-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-zinc-800 border-zinc-700"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-zinc-500">Minimum 6 characters</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-zinc-800 border-zinc-700"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
