"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WorldMap from "@/components/map/WorldMap";
import NodeDrawer from "@/components/map/NodeDrawer";
import { Loader2, List, Map as MapIcon, Wifi, Shield } from "lucide-react";

type VpnNode = {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  region: string;
  latitude: number;
  longitude: number;
  status: string;
  loadPercent: number;
  latencyMs: number;
  tier: string;
  requiredPlanSlug: string;
  requiredPerkSlugs: string;
  tags: string;
  protocols: string;
  currentUsers: number;
  maxUsers: number;
};

export default function MapPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<VpnNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedNode, setConnectedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<VpnNode | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [userPlan, setUserPlan] = useState("free");
  const [userPerks, setUserPerks] = useState<string[]>([]);
  const [profileEmail, setProfileEmail] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }
        setProfileEmail(session.user.email || "");

        const [nodesRes, meRes] = await Promise.all([
          fetch("/api/nodes"),
          fetch("/api/me"),
        ]);

        const nodesData = await nodesRes.json();
        setNodes(nodesData.nodes || []);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.profile?.currentPlan?.slug) {
            setUserPlan(meData.profile.currentPlan.slug);
          }
          if (meData.profile?.perks) {
            setUserPerks(meData.profile.perks.map((p: { perk: { slug: string } }) => p.perk.slug));
          }
        }
      } catch (e) {
        console.error("Failed to load:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const isLocked = useCallback((node: VpnNode) => {
    if (!node.requiredPlanSlug || node.requiredPlanSlug === "free") return false;
    const requiredPerks: string[] = JSON.parse(node.requiredPerkSlugs || "[]");
    const hasPerks = requiredPerks.every((p) => userPerks.includes(p));
    return node.requiredPlanSlug !== userPlan || !hasPerks;
  }, [userPlan, userPerks]);

  const handleConnect = async () => {
    if (!selectedNode) return;
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: selectedNode.id }),
      });
      if (res.ok) {
        setConnectedNode(selectedNode.id);
      }
    } catch (e) {
      console.error("Connect failed:", e);
    }
  };

  const handleDisconnect = async () => {
    if (!connectedNode) return;
    try {
      await fetch("/api/disconnect", { method: "POST", headers: { "Content-Type": "application/json" } });
      setConnectedNode(null);
    } catch (e) {
      console.error("Disconnect failed:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  const filteredNodes = nodes.filter((n) => n.status !== "maintenance");

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#c8a54e]" />
          <h1 className="text-lg font-semibold text-zinc-100">VPN Network</h1>
        </div>
        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-0.5">
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "map" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "list" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-zinc-800">
          <WorldMap
            nodes={filteredNodes}
            userPlan={userPlan}
            userPerks={userPerks}
            onNodeSelect={(node) => setSelectedNode(node)}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
          {filteredNodes.map((node) => {
            const locked = isLocked(node);
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${locked ? "bg-zinc-600" : node.status === "online" ? "bg-emerald-500" : node.status === "high_load" ? "bg-yellow-500" : "bg-zinc-600"}`} />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{node.city}</p>
                    <p className="text-[11px] text-zinc-500">{node.country} &middot; {node.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500">{node.loadPercent}%</span>
                  {locked && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">Locked</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedNode && (
        <NodeDrawer
          node={selectedNode}
          isLocked={isLocked(selectedNode)}
          isConnected={connectedNode === selectedNode.id}
          onClose={() => setSelectedNode(null)}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onUpgrade={() => router.push("/pricing")}
        />
      )}
    </div>
  );
}
