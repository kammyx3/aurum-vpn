"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, Sun, Moon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { createClient } from "@/lib/supabase/client";

const pageTitles: Record<string, string> = {
  "/app": "VPN Network",
  "/app/map": "VPN Network",
  "/app/locations": "Locations",
  "/app/devices": "Devices",
  "/app/account": "Account",
  "/app/billing": "Billing",
  "/app/perks": "Perks",
  "/app/settings": "Settings",
  "/admin": "Admin Panel",
};

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { plan, theme, setTheme, user, setUser } = useAppStore();

  const pageTitle = pageTitles[pathname] || "AURUM VPN";

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  return (
    <header className="z-30 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
            plan === "premium"
              ? "bg-[#c8a54e]/20 text-[#c8a54e]"
              : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
          )}
        >
          {plan === "premium" ? "Premium" : "Free"}
        </span>

        {user ? (
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Sign Out"
          >
            <LogOut className="size-4" />
          </button>
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
          className="p-1.5 rounded-md text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      </div>
    </header>
  );
}
