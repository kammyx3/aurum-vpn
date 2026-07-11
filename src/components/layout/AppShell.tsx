"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TitleBar from "@/components/desktop/TitleBar";
import { useAppStore } from "@/stores/appStore";
import { ToastProvider } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, theme, setUser, setPlan } = useAppStore();

  useEffect(() => {
    async function restoreSession() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const res = await fetch("/api/me");
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              const slug = data.profile.currentPlan?.slug || "free";
              setUser({ id: data.profile.id, username: data.profile.email, plan: slug });
              setPlan(slug === "free" ? "free" : "premium");
            }
          }
        } catch {
          // session fetch failed silently
        }
      }
    }
    restoreSession();
  }, [setUser, setPlan]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (theme === "dark") root.classList.add("dark");
      else if (theme === "light") root.classList.remove("dark");
      else {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        root.classList.toggle("dark", mq.matches);
      }
    };
    apply();
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <TitleBar />
        <div className="flex flex-1 min-h-0">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex flex-1 flex-col min-w-0 lg:ml-60">
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
