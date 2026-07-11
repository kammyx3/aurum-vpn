"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Map,
  Globe,
  Monitor,
  User,
  CreditCard,
  Gift,
  Settings,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";

const navItems = [
  { label: "VPN Network", href: "/app/map", icon: Map },
  { label: "Locations", href: "/app/locations", icon: Globe },
  { label: "Devices", href: "/app/devices", icon: Monitor },
  { label: "Account", href: "/app/account", icon: User },
  { label: "Billing", href: "/app/billing", icon: CreditCard },
  { label: "Perks", href: "/app/perks", icon: Gift },
  { label: "Settings", href: "/app/settings", icon: Settings },
  { label: "Admin", href: "/admin", icon: Lock },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { plan, vpnMode } = useAppStore();

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
          "fixed top-0 left-0 z-50 h-full w-60 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-5 h-14 border-b border-sidebar-border shrink-0">
          <Shield className="size-5 text-[#c8a54e]" />
          <span className="font-semibold text-sm tracking-wider">
            <span className="text-[#c8a54e]">AURUM</span>
            <span className="text-muted-foreground ml-1">VPN</span>
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
                    ? "bg-sidebar-accent text-foreground border-l-2 border-[#c8a54e]"
                    : "text-sidebar-fg hover:text-foreground hover:bg-sidebar-accent border-l-2 border-transparent"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                plan === "premium"
                  ? "bg-[#c8a54e]/20 text-[#c8a54e]"
                  : "bg-sidebar-accent text-sidebar-fg"
              )}
            >
              {plan === "premium" ? "Premium" : "Free"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-sidebar-accent text-sidebar-fg">
              {vpnMode}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
