"use client";

import { useState, Suspense } from "react"; // 1. Added Suspense
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";

// 2. Move your logic into a sub-component
function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/overview";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "UserBanned") {
          toast.error("Account Banned", {
            description:
              "Your account has been banned. Please contact the administrator.",
          });
        } else {
          toast.error("Login Failed", {
            description: "Invalid email or password. Please try again.",
          });
        }
        setIsLoading(false);
      } else {
        toast.success("Login Successful", {
          description: "Redirecting to dashboard...",
        });
        setTimeout(() => {
          window.location.href = callbackUrl;
        }, 500);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-zinc-400">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-zinc-800 border-zinc-700 focus:border-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-zinc-400">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-zinc-800 border-zinc-700 focus:border-emerald-500 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}

// 3. Keep the layout in the main export and wrap the form
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/rikkastore-removebg-preview.png"
              alt="Rikkastore"
              width={100}
              height={100}
              className="w-10 h-10 object-contain mt-3"
            />
            <span className="text-2xl font-bold text-white">
              Accounts Interactive Catalog
            </span>
          </Link>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 4. The Suspense Boundary fixes the error */}
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="animate-spin text-emerald-500" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>

            <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-sm text-zinc-400 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-zinc-500">
                <p>
                  <span className="text-emerald-400">Super Admin:</span>{" "}
                  admin@catalog.com / 123456
                </p>
                <p>
                  <span className="text-emerald-400">Supplier:</span>{" "}
                  supplier@catalog.com / 123456
                </p>
                <p>
                  <span className="text-emerald-400">Reseller:</span>{" "}
                  reseller@catalog.com / 123456
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link
            href="/catalog"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
