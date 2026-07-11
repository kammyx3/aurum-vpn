"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Check, X, ArrowUpCircle, Loader2 } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  maxDevices: number;
  features: string;
  sortOrder: number;
};

const planFeatures: Record<string, string[]> = {
  free: ["VPN access", "1 device", "Free nodes only", "50 GB/mo bandwidth"],
  basic: ["VPN access", "3 devices", "Standard locations", "500 GB/mo bandwidth", "Basic support"],
  plus: ["VPN access", "5 devices", "All standard locations", "Streaming-optimized nodes", "2 TB/mo bandwidth", "Priority routing"],
  pro: ["VPN access", "10 devices", "All global nodes", "Streaming & gaming nodes", "Unlimited bandwidth", "Multi-hop", "Premium regions", "Priority support"],
  business: ["VPN access", "25 devices", "All global nodes", "Streaming & gaming", "Unlimited bandwidth", "Multi-hop", "Dedicated IP", "Team management", "Central billing", "24/7 priority support"],
};

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [yearly, setYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("");
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
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelect = async (slug: string) => {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug: slug }),
    });
    if (res.ok) {
      setCurrentPlan(slug);
      router.push("/app/billing");
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen bg-background text-zinc-200">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#c8a54e]/10 mb-4">
            <Shield className="h-6 w-6 text-[#c8a54e]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Choose your plan</h1>
          <p className="text-muted-foreground mt-2 text-sm">Get the right VPN for your needs</p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-xs ${!yearly ? "text-zinc-200 font-medium" : "text-muted-foreground"}`}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-10 h-5 rounded-full transition-colors ${yearly ? "bg-[#c8a54e]" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${yearly ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className={`text-xs ${yearly ? "text-zinc-200 font-medium" : "text-muted-foreground"}`}>
              Yearly <span className="text-emerald-500 ml-1">Save up to 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.slug === currentPlan;
            const price = yearly ? plan.priceYearly : plan.priceMonthly;
            const displayPrice = plan.priceMonthly === 0 ? "Free" : `$${(price / 100).toFixed(2)}`;
            const features = planFeatures[plan.slug] || [];

            return (
              <div
                key={plan.id}
                className={`relative p-5 rounded-xl border transition-all ${
                  isCurrent ? "border-[#c8a54e]/50 bg-[#c8a54e]/5" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                {plan.slug === "plus" && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#c8a54e] text-[10px] font-semibold text-black">
                    Most Popular
                  </div>
                )}
                <h3 className="text-sm font-semibold text-zinc-100">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{displayPrice}</span>
                  {plan.priceMonthly > 0 && <span className="text-xs text-muted-foreground ml-1">/{yearly ? "yr" : "mo"}</span>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{plan.maxDevices} device{plan.maxDevices > 1 ? "s" : ""}</p>

                <ul className="mt-4 space-y-1.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(plan.slug)}
                  disabled={isCurrent}
                  className={`mt-5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "bg-zinc-800 text-muted-foreground cursor-default"
                      : plan.priceMonthly === 0
                      ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                      : "bg-[#c8a54e] hover:bg-[#b8963e] text-black"
                  }`}
                >
                  {isCurrent ? "Current Plan" : plan.priceMonthly === 0 ? "Downgrade" : "Choose Plan"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-8">
          All plans include WireGuard VPN protocol, DNS leak protection, and 24/7 network monitoring.
          Prices shown are in USD.
        </p>
      </div>
    </div>
  );
}
