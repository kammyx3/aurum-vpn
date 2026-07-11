"use client";

import { useEffect, useState } from "react";
import { Globe, Wifi, WifiOff, Lock, Loader2 } from "lucide-react";

type VpnNode = {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  region: string;
  status: string;
  loadPercent: number;
  tier: string;
  requiredPlanSlug: string;
};

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  high_load: "bg-yellow-500",
  maintenance: "bg-orange-500",
  offline: "bg-red-500",
};

export default function LocationsPage() {
  const [nodes, setNodes] = useState<VpnNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"country" | "region">("country");

  useEffect(() => {
    fetch("/api/nodes")
      .then((r) => r.json())
      .then((d) => setNodes(d.nodes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const groups: Record<string, VpnNode[]> = {};
  nodes
    .filter((n) => n.status !== "maintenance")
    .forEach((n) => {
      const key = groupBy === "country" ? `${n.country} (${n.countryCode})` : n.region;
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-[#c8a54e]" />
          <h1 className="text-lg font-semibold text-zinc-100">Locations</h1>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-0.5">
          <button onClick={() => setGroupBy("country")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${groupBy === "country" ? "bg-zinc-700 text-zinc-100" : "text-muted-foreground"}`}>Country</button>
          <button onClick={() => setGroupBy("region")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${groupBy === "region" ? "bg-zinc-700 text-zinc-100" : "text-muted-foreground"}`}>Region</button>
        </div>
      </div>

      {Object.entries(groups).map(([group, groupNodes]) => (
        <div key={group} className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</h2>
          <div className="space-y-1">
            {groupNodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${statusColors[node.status] || "bg-zinc-600"}`} />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{node.city}</p>
                    <p className="text-[11px] text-muted-foreground">{node.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{node.loadPercent}%</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">{node.tier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
