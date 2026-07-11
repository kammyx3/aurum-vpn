"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppStore } from "@/stores/appStore";
import { ToastProvider } from "@/components/ui/toast";
import { apiFetch, getStoredToken } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, setUser, setPlan } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const token = getStoredToken();
      if (!token) { setLoading(false); return; }

      try {
        const res = await apiFetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const slug = data.profile.currentPlan?.slug || "free";
            setUser({ id: data.profile.id, username: data.profile.email, plan: slug });
            setPlan(slug === "free" ? "free" : "premium");
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    }

    restore();
  }, [setUser, setPlan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col min-w-0 lg:ml-60 overflow-y-auto relative">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 p-6">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
