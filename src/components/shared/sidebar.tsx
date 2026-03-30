"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  History,
  LogOut,
  Menu,
  X,
  Store,
  Gamepad2,
  Star,
  CreditCard,
  Gift,
  ClipboardList,
  Settings,
  Database,
  UserCog,
  Receipt,
  UserCircle,
  TrendingUp,
  DollarSign,
  Banknote,
  Percent,
  Activity,
  Sword,
  Globe,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUserBalance } from "@/hooks/useUserBalance";

interface SidebarProps {
  role?: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface MenuGroup {
  heading: string;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const menuGroups: Record<string, MenuGroup[]> = {
  SUPER_ADMIN: [
    {
      heading: "Dashboard",
      items: [
        {
          icon: LayoutDashboard,
          label: "Overview",
          href: "/dashboard/overview",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "Daily Operations",
      items: [
        {
          icon: ClipboardList,
          label: "Top-up Requests",
          href: "/dashboard/topup-requests",
        },
        {
          icon: Banknote,
          label: "Withdrawal Requests",
          href: "/dashboard/withdrawal-requests",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "Master Data",
      items: [
        { icon: Gamepad2, label: "Games Master", href: "/dashboard/game" },
        {
          icon: Star,
          label: "Characters Master",
          href: "/dashboard/character",
        },
        { icon: Sword, label: "Weapons Master", href: "/dashboard/weapon" },
        { icon: Globe, label: "Servers Master", href: "/dashboard/server" },
      ],
      defaultOpen: true,
    },
    {
      heading: "User Management",
      items: [
        { icon: Users, label: "User List", href: "/dashboard/users" },
        { icon: UserCog, label: "User Tiers", href: "/dashboard/tiers" },
      ],
      defaultOpen: true,
    },
    {
      heading: "Finance & Reports",
      items: [
        { icon: Wallet, label: "Finance Overview", href: "/dashboard/finance" },
        {
          icon: TrendingUp,
          label: "Platform Earnings",
          href: "/dashboard/platform-earnings",
        },
        {
          icon: DollarSign,
          label: "Pending Balances",
          href: "/dashboard/pending-balances",
        },
        {
          icon: History,
          label: "All Transactions",
          href: "/dashboard/transactions",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "Configurations",
      items: [
        {
          icon: CreditCard,
          label: "Payment Methods",
          href: "/dashboard/payment-methods",
        },
        {
          icon: Gift,
          label: "Top-up Packages",
          href: "/dashboard/topup-packages",
        },
        {
          icon: Percent,
          label: "Platform Settings",
          href: "/dashboard/platform-settings",
        },
      ],
      defaultOpen: false,
    },
    {
      heading: "Account & Logs",
      items: [
        {
          icon: Activity,
          label: "Activity Logs",
          href: "/dashboard/activity-logs",
        },
        { icon: UserCircle, label: "Profile", href: "/dashboard/profile" },
      ],
      defaultOpen: false,
    },
  ],

  SUPPLIER: [
    {
      heading: "Dashboard",
      items: [
        {
          icon: LayoutDashboard,
          label: "Overview",
          href: "/dashboard/overview",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "My Store",
      items: [
        {
          icon: Package,
          label: "My Accounts (Stock)",
          href: "/dashboard/inventory",
        },
        { icon: Receipt, label: "Sales History", href: "/dashboard/sales" },
        {
          icon: DollarSign,
          label: "Pending Earnings",
          href: "/dashboard/pending-earnings",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "Marketplace",
      items: [
        {
          icon: Eye,
          label: "Tracked Accounts",
          href: "/dashboard/tracked-accounts",
        },
        {
          icon: ShoppingCart,
          label: "Extract Account",
          href: "/dashboard/extract",
        },
        {
          icon: KeyRound,
          label: "Extract History",
          href: "/dashboard/extract-history",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "Wallet & Finance",
      items: [
        { icon: Wallet, label: "Top-up Balance", href: "/dashboard/topup" },
        { icon: Banknote, label: "Withdrawal", href: "/dashboard/withdrawal" },
        {
          icon: History,
          label: "Transaction History",
          href: "/dashboard/transactions",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "Account",
      items: [
        {
          icon: Activity,
          label: "My Activity",
          href: "/dashboard/my-activity",
        },
        { icon: UserCircle, label: "Profile", href: "/dashboard/profile" },
      ],
      defaultOpen: false,
    },
  ],

  RESELLER: [
    {
      heading: "Dashboard",
      items: [
        {
          icon: LayoutDashboard,
          label: "Overview",
          href: "/dashboard/overview",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "Marketplace",
      items: [
        {
          icon: Eye,
          label: "Tracked Accounts",
          href: "/dashboard/tracked-accounts",
        },
        {
          icon: ShoppingCart,
          label: "Extract Account",
          href: "/dashboard/extract",
        },
        {
          icon: KeyRound,
          label: "Extract History",
          href: "/dashboard/extract-history",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "Wallet & Finance",
      items: [
        { icon: Wallet, label: "Top-up Balance", href: "/dashboard/topup" },
        { icon: Banknote, label: "Withdrawal", href: "/dashboard/withdrawal" },
        {
          icon: History,
          label: "Transaction History",
          href: "/dashboard/transactions",
        },
      ],
      defaultOpen: true,
    },
    {
      heading: "Account",
      items: [
        {
          icon: Activity,
          label: "My Activity",
          href: "/dashboard/my-activity",
        },
        { icon: UserCircle, label: "Profile", href: "/dashboard/profile" },
      ],
      defaultOpen: false,
    },
  ],
};

// Hook to manage collapsed state for groups
function useCollapsedGroups(role: string, groups: MenuGroup[]) {
  const storageKey = `sidebar-collapsed-${role}`;

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      } catch {
        // Ignore errors
      }
    }
    // Default: collapse groups where defaultOpen is false
    return new Set(
      groups.filter((g) => g.defaultOpen === false).map((g) => g.heading),
    );
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...collapsedGroups]));
    } catch {
      // Ignore errors
    }
  }, [collapsedGroups, storageKey]);

  const toggleGroup = (heading: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(heading)) {
        newSet.delete(heading);
      } else {
        newSet.add(heading);
      }
      return newSet;
    });
  };

  const isCollapsed = (heading: string) => collapsedGroups.has(heading);

  return { isCollapsed, toggleGroup };
}

// Sidebar Content Component
function SidebarContent({
  role,
  pathname,
  onNavigate,
}: {
  role: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const groups = menuGroups[role] || [];
  const { isCollapsed, toggleGroup } = useCollapsedGroups(role, groups);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-emerald-900/30 px-6">
        <img
          src="/rikkastore-removebg-preview.png"
          alt="Rikkastore Logo"
          width={45}
          height={45}
        />
        <span className="text-xl font-bold text-white">AIC Dashboard</span>
      </div>

      {/* Navigation with Collapsible Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => {
          const collapsed = isCollapsed(group.heading);
          const hasActiveItem = group.items.some(
            (item) =>
              pathname === item.href || pathname.startsWith(item.href + "/"),
          );

          return (
            <div key={group.heading} className="mb-2">
              {/* Group Header - Clickable */}
              <button
                onClick={() => toggleGroup(group.heading)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/50"
              >
                <span>{group.heading}</span>
                {collapsed ? (
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                )}
              </button>

              {/* Group Items - Collapsible */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-in-out",
                  collapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100",
                )}
              >
                <div className="space-y-1 mt-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-emerald-600/20 text-emerald-400"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Back to Catalog */}
      <div className="border-t border-emerald-900/30 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <Store className="h-5 w-5" />
          Back to Catalog
        </Link>
      </div>
    </div>
  );
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Main Container */}
      <aside
        className={cn(
          // KUNCI PERBAIKAN:
          // h-screen & sticky top-0 memastikan sidebar selalu setinggi layar dan menempel di atas
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-zinc-900 transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:min-h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent
          role={role || "RESELLER"}
          pathname={pathname}
          onNavigate={() => setIsOpen(false)}
        />
      </aside>
    </>
  );
}

export function Header() {
  const { data: session } = useSession();
  const { balance, salesBalance, pendingBalance, isLoading, refreshBalance } =
    useUserBalance();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-emerald-900/30 bg-zinc-900 px-4 lg:px-6">
      <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            {/* Balance display for Supplier/Reseller */}
            {(session.user.role === "RESELLER" ||
              session.user.role === "SUPPLIER") && (
              <div className="text-sm hidden sm:flex items-center gap-2">
                <span className="text-zinc-400">Saldo Pembelian: </span>
                <span className="font-semibold text-emerald-400">
                  Rp {balance?.toLocaleString() || "0"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => refreshBalance()}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-3 w-3 text-zinc-400 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>
            )}

            {/* Sales Balance for Supplier */}
            {session.user.role === "SUPPLIER" && (
              <div className="text-sm hidden sm:block">
                <span className="text-zinc-400">Saldo Penjualan: </span>
                <span className="font-semibold text-cyan-400">
                  Rp {salesBalance?.toLocaleString() || "0"}
                </span>
                {pendingBalance ? (
                  <span className="text-amber-400 ml-2">
                    (Pending: Rp {pendingBalance?.toLocaleString()})
                  </span>
                ) : null}
              </div>
            )}

            <div className="text-sm hidden sm:block">
              <span className="text-zinc-400">Welcome, </span>
              <span className="font-semibold text-white">
                {session.user.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-zinc-400 hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
