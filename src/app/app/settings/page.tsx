"use client";

import { Settings, Moon, Sun, Monitor, Shield } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export default function SettingsPage() {
  const { theme, setTheme } = useAppStore();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-[#c8a54e]" />
        <h1 className="text-lg font-semibold text-zinc-100">Settings</h1>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Theme</label>
          <div className="flex items-center gap-2 mt-2">
            {[
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "System" },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value as "light" | "dark" | "system")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  theme === value
                    ? "bg-zinc-700 text-zinc-100"
                    : "bg-zinc-800/50 text-muted-foreground hover:text-zinc-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">About</label>
          <div className="mt-2 space-y-1 text-xs text-zinc-400">
            <p>AURUM VPN v1.1.2</p>
            <p className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-[#c8a54e]" />
              WireGuard protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
