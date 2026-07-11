"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";

export default function ThemeProvider() {
  const { theme } = useAppStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        localStorage.setItem("zeit-theme", "dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
        localStorage.setItem("zeit-theme", "light");
      } else {
        localStorage.setItem("zeit-theme", "system");
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        if (mq.matches) root.classList.add("dark");
        else root.classList.remove("dark");
        const handler = () => {
          if (mq.matches) root.classList.add("dark");
          else root.classList.remove("dark");
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
      }
    } catch {}
  }, [theme]);

  return null;
}
