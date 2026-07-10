"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace("/overview"); }, [router]);
  return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading...</p></div>;
}
