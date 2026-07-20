"use client";

import type { ReactNode, ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Wallet,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: ElementType;
}

const customerNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Errands", href: "/errands", icon: ListChecks },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

const runnerNav: NavItem[] = [
  { label: "Overview", href: "/runner/dashboard", icon: LayoutDashboard },
  { label: "Available Jobs", href: "/runner/jobs", icon: ListChecks },
  { label: "Wallet", href: "/runner/wallet", icon: Wallet },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function DashboardShell({
  role,
  fullName,
  children,
}: {
  role: "customer" | "runner";
  fullName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "runner" ? runnerNav : customerNav;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-brand-gray-light/40">
      <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-1 px-2 text-xl font-bold">
          <span className="text-brand-green">R</span>
          <span className="text-brand-navy">UNAM</span>
        </Link>

        {role === "customer" && (
          <Link href="/errands/new">
            <button className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark">
              <PlusCircle className="h-4 w-4" />
              Post an Errand
            </button>
          </Link>
        )}

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-green/10 text-brand-green"
                    : "text-brand-gray hover:bg-brand-gray-light hover:text-brand-navy"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-gray transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 lg:px-10">
          <div>
            <p className="text-sm text-brand-gray">Welcome back,</p>
            <p className="text-lg font-semibold text-brand-navy">{fullName}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 text-sm font-semibold text-brand-green">
            {fullName.slice(0, 1).toUpperCase()}
          </div>
        </header>
        <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
