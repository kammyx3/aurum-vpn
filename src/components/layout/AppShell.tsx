"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppStore } from "@/stores/appStore";
import { ToastProvider } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, setUser, setPlan } = useAppStore();

  useEffect(() => {
    async function restore() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch("/api/me");
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              const slug = data.profile.currentPlan?.slug || "free";
              setUser({ id: data.profile.id, username: data.profile.email, plan: slug });
              setPlan(slug === "free" ? "free" : "premium");
            }
          }
        }
      } catch {
        // not authenticated
      }
    }
    restore();
  }, [setUser, setPlan]);

  return (
    <ToastProvider>
      <div className="flex flex-1 min-h-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col min-w-0 lg:ml-60">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
