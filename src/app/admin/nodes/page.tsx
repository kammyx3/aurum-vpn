"use client";

import { useEffect, useState } from "react";
import { Server, Plus, Loader2 } from "lucide-react";

type VpnNode = {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  status: string;
  tier: string;
  loadPercent: number;
  active: boolean;
};

export default function AdminNodesPage() {
  const [nodes, setNodes] = useState<VpnNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/nodes")
      .then((r) => r.json())
      .then((d) => setNodes(d.nodes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-[#c8a54e]" />
          <h1 className="text-lg font-semibold text-zinc-100">VPN Nodes</h1>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#c8a54e] hover:bg-[#b8963e] text-black text-xs font-semibold transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Add Node
        </button>
      </div>

      <div className="space-y-1">
        {nodes.map((node) => (
          <div key={node.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center gap-3">
              <span className={`h-2 w-2 rounded-full ${node.active ? "bg-emerald-500" : "bg-red-500"}`} />
              <div>
                <p className="text-sm font-medium text-zinc-200">{node.name}</p>
                <p className="text-[11px] text-muted-foreground">{node.city}, {node.country}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">{node.tier}</span>
              <span className="text-xs text-muted-foreground">{node.loadPercent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
