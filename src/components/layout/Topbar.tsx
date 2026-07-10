"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, Sun, Moon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/devices": "Devices",
  "/vpn-configs": "VPN Configs",
  "/server-status": "Server Status",
  "/activity": "Activity",
  "/regions": "Regions",
  "/security": "Security",
  "/premium": "Premium",
  "/settings": "Settings",
  "/admin": "Admin Panel",
};

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { plan, theme, setTheme, user, logout } = useAppStore();

  const pageTitle = pageTitles[pathname] || "Overview";

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="size-2 rounded-full bg-emerald-500 inline-block" />
          <span>Connected</span>
        </div>

        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
            plan === "premium"
              ? "bg-[#c8a54e]/20 text-[#c8a54e]"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          )}
        >
          {plan === "premium" ? "Premium" : "Free"}
        </span>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{user.username}</span>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                logout();
                router.push("/overview");
              }}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Logout"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="text-xs font-medium text-[#c8a54e] hover:text-[#d4b85e]"
          >
            Login
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {theme === "dark" ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </button>
      </div>
    </header>
  );
}
