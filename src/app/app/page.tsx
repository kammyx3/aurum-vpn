"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppHome() {
  const router = useRouter();
  useEffect(() => { router.replace("/app/overview"); }, [router]);
  return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading...</p></div>;
}
