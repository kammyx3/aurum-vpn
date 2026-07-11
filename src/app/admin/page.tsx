"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Server, Users, CreditCard, Gift, Activity, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        if (data.profile?.role === "admin") {
          setAuthorized(true);
        } else {
          router.push("/app/map");
        }
      }
      setLoading(false);
    }
    check();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!authorized) return null;

  const sections = [
    { label: "VPN Nodes", href: "/admin/nodes", icon: Server, desc: "Manage AURUM VPN server nodes" },
    { label: "Users", href: "/admin/users", icon: Users, desc: "View and manage users" },
    { label: "Plans", href: "/admin/plans", icon: CreditCard, desc: "Manage subscription plans" },
    { label: "Perks", href: "/admin/perks", icon: Gift, desc: "Manage add-ons and perks" },
    { label: "Activity", href: "/admin/activity", icon: Activity, desc: "View audit logs" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-[#c8a54e]" />
        <h1 className="text-lg font-semibold text-zinc-100">Admin Panel</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-[#c8a54e]" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
