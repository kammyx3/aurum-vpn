"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, Sun, Moon, LogOut, User } from "lucide-react";
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
  const { plan, theme, setTheme, user, setUser, setPlan } = useAppStore();

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
    setPlan("free");
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-white/80 dark:bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-foreground">{user.username}</span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {plan === "premium" ? "Premium" : "Free"}
            </span>
          </>
        )}

        {!user && (
          <button
            onClick={() => router.push("/login")}
            className="text-xs font-medium text-accent hover:text-[#d4b85e]"
          >
            Sign In
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          title={theme === "dark" ? "Light mode" : theme === "light" ? "System mode" : "Dark mode"}
        >
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>

        {user && (
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Sign Out"
          >
            <LogOut className="size-4" />
          </button>
        )}
      </div>
    </header>
  );
}
