"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Shield, CreditCard, LogOut, Loader2, Crown } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<{ name: string; slug: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }
        setEmail(session.user.email || "");

        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.currentPlan) setPlan(data.profile.currentPlan);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-[#c8a54e]" />
        <h1 className="text-lg font-semibold text-zinc-100">Account</h1>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Email</label>
          <div className="flex items-center gap-2 mt-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{email}</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Plan</label>
          <div className="flex items-center gap-2 mt-1">
            <Crown className={`h-4 w-4 ${plan?.slug === "free" ? "text-muted-foreground" : "text-[#c8a54e]"}`} />
            <span className="text-sm text-foreground capitalize">{plan?.name || "Free"}</span>
            {plan?.slug === "free" && (
              <button onClick={() => router.push("/pricing")} className="ml-auto text-xs text-[#c8a54e] hover:text-[#d4b85e] font-medium">
                Upgrade
              </button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Quick Actions</label>
          <div className="mt-2 space-y-1">
            <button onClick={() => router.push("/app/billing")} className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-zinc-800 text-sm text-zinc-300 transition-colors">
              <CreditCard className="h-4 w-4" />
              Billing &amp; Plans
            </button>
            <button onClick={() => router.push("/app/perks")} className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-zinc-800 text-sm text-zinc-300 transition-colors">
              <Shield className="h-4 w-4" />
              My Perks
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-400 text-sm font-medium transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
