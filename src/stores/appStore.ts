"use client";

import { create } from "zustand";

interface AppState {
  theme: "light" | "dark" | "system";
  plan: "free" | "premium";
  sidebarOpen: boolean;
  vpnMode: string;
  user: { id: string; username: string; plan: string } | null;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setPlan: (plan: "free" | "premium") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setVpnMode: (mode: string) => void;
  setUser: (user: { id: string; username: string; plan: string } | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "system",
  plan: "free",
  sidebarOpen: true,
  vpnMode: "demo",
  user: null,
  setTheme: (theme) => set({ theme }),
  setPlan: (plan) => set({ plan }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setVpnMode: (mode) => set({ vpnMode: mode }),
  setUser: (user) => set({ user, plan: user?.plan as "free" | "premium" | undefined ?? "free" }),
  logout: () => set({ user: null, plan: "free" }),
}));
