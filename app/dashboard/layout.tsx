"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HandCoins,
  History,
  PlusCircle,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Key,
} from "lucide-react";
import Image from "next/image";
import logo from "@/public/cash.png";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const navItems = [
  {
    label: "Tableau de Bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Nouveau Client",
    href: "/dashboard/new-client",
    icon: PlusCircle,
  },
  {
    label: "Prêts",
    href: "/dashboard/prets",
    icon: HandCoins,
  },
  {
    label: "Historique",
    href: "/dashboard/historique",
    icon: History,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const logOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          flex flex-col
          bg-white border-r border-slate-200 shadow-xs
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 min-h-[64px]">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/25">
            <Image src={logo} alt="logo" className="w-6 h-6 object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-slate-900 font-bold text-base tracking-wide truncate">
                Ti kanè
              </span>
              <span className="text-violet-600 text-xs font-semibold">
                Finance Manager
              </span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 group relative font-medium text-sm
                  ${
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/25 font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`flex-shrink-0 w-5 h-5 ${
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                  }`}
                />
                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <button
            onClick={logOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 group text-sm font-medium"
            title={collapsed ? "Déconnexion" : undefined}
          >
            <LogOut className="flex-shrink-0 w-5 h-5" />
            {!collapsed && (
              <span>Déconnexion</span>
            )}
          </button>
        </div>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 items-center justify-center hover:bg-violet-50 hover:border-violet-300 text-slate-500 hover:text-violet-600 transition-all duration-200 shadow-sm z-10"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium">Ti kanè</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-semibold">
                {navItems.find(
                  (n) =>
                    pathname === n.href ||
                    (n.href !== "/dashboard" && pathname.startsWith(n.href)),
                )?.label ?? "Dashboard"}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold hidden sm:block">
                En ligne
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
