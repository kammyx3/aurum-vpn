"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppStore } from "@/stores/appStore";
import { ToastProvider } from "@/components/ui/toast";
import { createClient, apiFetch, getStoredToken, storeToken, clearToken } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, setUser, setPlan } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function check() {
      const token = getStoredToken();
      if (!token) {
        setChecking(false);
        router.replace("/login");
        return;
      }
      try {
        const res = await apiFetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const slug = data.profile.currentPlan?.slug || "free";
            setUser({ id: data.profile.id, username: data.profile.email, plan: slug });
            setPlan(slug === "free" ? "free" : "premium");
          }
        } else {
          // Token invalid, clear and redirect
          clearToken();
          router.replace("/login");
          return;
        }
      } catch {} finally {
        setChecking(false);
      }
    }

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        storeToken(session);
        check();
      } else {
        clearToken();
        setUser(null);
        setPlan("free");
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setUser, setPlan]);

  if (checking) {
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
