"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Monitor,
  FileText,
  Server,
  Activity,
  Globe,
  Crown,
  Settings,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";

const navItems = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Devices", href: "/devices", icon: Monitor },
  { label: "VPN Configs", href: "/configs", icon: FileText },
  { label: "Server Status", href: "/server", icon: Server },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Regions", href: "/regions", icon: Globe },
  { label: "Security", href: "/security", icon: Shield },
  { label: "Premium", href: "/premium", icon: Crown },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Admin", href: "/admin", icon: Lock },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { plan, vpnMode, user } = useAppStore();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-60 bg-[#111113] border-r border-zinc-800 flex flex-col transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-5 h-14 border-b border-zinc-800 shrink-0">
          <Shield className="size-5 text-[#c8a54e]" />
          <span className="font-semibold text-sm tracking-wider">
            <span className="text-[#c8a54e]">AURUM</span>
            <span className="text-zinc-500 ml-1">VPN</span>
          </span>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-5 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-zinc-800/60 text-white border-l-2 border-[#c8a54e]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border-l-2 border-transparent"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800 shrink-0">
          {user && (
            <div className="mb-2 text-xs text-zinc-500 truncate">
              {user.username}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                plan === "premium"
                  ? "bg-[#c8a54e]/20 text-[#c8a54e]"
                  : "bg-zinc-800 text-zinc-400"
              )}
            >
              {plan === "premium" ? "Premium" : "Free"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {vpnMode}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
