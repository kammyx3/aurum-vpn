"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppStore } from "@/stores/appStore";
import { ToastProvider } from "@/components/ui/toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <ToastProvider>
      <div className="flex flex-1 min-h-0">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex flex-1 flex-col min-w-0 lg:ml-60">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
