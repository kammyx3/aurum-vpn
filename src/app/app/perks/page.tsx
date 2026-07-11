"use client";

import { useEffect, useState } from "react";
import { Shield, CheckCircle, Loader2, Plus } from "lucide-react";

type Perk = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  type: string;
};

export default function PerksPage() {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [activePerks, setActivePerks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [perksRes, meRes] = await Promise.all([
          fetch("/api/billing/perks"),
          fetch("/api/me"),
        ]);
        if (perksRes.ok) {
          const d = await perksRes.json();
          setPerks(d.perks || []);
        }
        if (meRes.ok) {
          const d = await meRes.json();
          if (d.profile?.perks) {
            setActivePerks(d.profile.perks.map((p: { perk: { slug: string } }) => p.perk.slug));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-[#c8a54e]" />
        <h1 className="text-lg font-semibold text-zinc-100">Perks &amp; Add-ons</h1>
      </div>

      <div className="space-y-2">
        {activePerks.length > 0 && (
          <>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Your Active Perks</h2>
            {perks.filter((p) => activePerks.includes(p.slug)).map((perk) => (
              <div key={perk.id} className="p-3 rounded-lg bg-emerald-900/10 border border-emerald-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-zinc-200">{perk.name}</span>
                  </div>
                  <span className="text-[11px] text-emerald-500">Active</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 ml-6">{perk.description}</p>
              </div>
            ))}
          </>
        )}

        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-4">
          Available Add-ons
        </h2>
        {perks.filter((p) => !activePerks.includes(p.slug)).length === 0 && activePerks.length === perks.length && (
          <p className="text-xs text-zinc-500 text-center py-8">
            You have all available perks. Check back for new add-ons!
          </p>
        )}
        {perks.filter((p) => !activePerks.includes(p.slug)).map((perk) => (
          <div key={perk.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-200">{perk.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">${(perk.priceMonthly / 100).toFixed(2)}/mo</span>
                <button className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors">
                  Add
                </button>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 ml-6">{perk.description}</p>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-amber-900/10 border border-amber-900/20">
        <p className="text-xs text-amber-400 font-medium">Development Mode</p>
        <p className="text-[11px] text-amber-500/70 mt-1">
          Perk purchases are in test mode. Connect Stripe for real payment processing.
        </p>
      </div>
    </div>
  );
}
