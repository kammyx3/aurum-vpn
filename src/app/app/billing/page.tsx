"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Crown, Shield, Loader2, ArrowUpCircle, CheckCircle } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  maxDevices: number;
  features: string;
};

export default function BillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState("");
  const [billing, setBilling] = useState<{ type: string; events: number }>({ type: "monthly", events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [plansRes, meRes] = await Promise.all([
          fetch("/api/billing/plans"),
          fetch("/api/me"),
        ]);
        if (plansRes.ok) {
          const d = await plansRes.json();
          setPlans(d.plans || []);
        }
        if (meRes.ok) {
          const d = await meRes.json();
          if (d.profile?.currentPlan?.slug) setCurrentPlan(d.profile.currentPlan.slug);
          if (d.billingEvents) setBilling((prev) => ({ ...prev, events: d.billingEvents.length }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpgrade = async (slug: string) => {
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: slug }),
      });
      if (res.ok) {
        setCurrentPlan(slug);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-[#c8a54e]" />
        <h1 className="text-lg font-semibold text-zinc-100">Billing</h1>
      </div>

      <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Current Plan</label>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <Crown className={`h-4 w-4 ${currentPlan === "free" ? "text-muted-foreground" : "text-[#c8a54e]"}`} />
            <span className="text-sm text-zinc-200 font-medium capitalize">{currentPlan || "Free"}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {currentPlan === "free" ? "No active subscription" : "Active"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Plans</h2>
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentPlan;
          const features: string[] = Object.entries(JSON.parse(plan.features || "{}"))
            .filter(([, v]) => v)
            .map(([k]) => k.replace(/([A-Z])/g, " $1").trim());

          return (
            <div key={plan.id} className={`p-4 rounded-lg border ${isCurrent ? "border-[#c8a54e]/40 bg-[#c8a54e]/5" : "border-zinc-800 bg-zinc-900/50"}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">{plan.name}</h3>
                    {isCurrent && <CheckCircle className="h-4 w-4 text-[#c8a54e]" />}
                  </div>
                  <p className="text-xs text-muted-foreground">${(plan.priceMonthly / 100).toFixed(2)}/mo &middot; {plan.maxDevices} devices</p>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => handleUpgrade(plan.slug)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#c8a54e] hover:bg-[#b8963e] text-black text-xs font-semibold transition-colors"
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                    {plan.priceMonthly === 0 ? "Downgrade" : "Upgrade"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {features.map((f) => (
                  <span key={f} className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 capitalize">{f}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-lg bg-amber-900/10 border border-amber-900/20">
        <p className="text-xs text-amber-400 font-medium">Development Mode</p>
        <p className="text-[11px] text-amber-500/70 mt-1">
          Billing is in test mode. Plan changes apply immediately without real payment.
          Connect Stripe for production billing.
        </p>
      </div>
    </div>
  );
}
