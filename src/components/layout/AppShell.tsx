"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TitleBar from "@/components/desktop/TitleBar";
import { useAppStore } from "@/stores/appStore";
import { ToastProvider } from "@/components/ui/toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, theme } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
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
      <div className="flex flex-col min-h-screen">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex flex-1 flex-col overflow-auto lg:ml-60">
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
