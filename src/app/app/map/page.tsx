"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WorldMap from "@/components/map/WorldMap";
import NodeDrawer from "@/components/map/NodeDrawer";
import { Loader2, List, Map as MapIcon } from "lucide-react";

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

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }

        const [nodesRes, meRes] = await Promise.all([
          fetch("/api/nodes"),
          fetch("/api/me"),
        ]);

        const nodesData = await nodesRes.json();
        setNodes(nodesData.nodes || []);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.profile?.currentPlan?.slug) setUserPlan(meData.profile.currentPlan.slug);
          if (meData.profile?.perks) setUserPerks(meData.profile.perks.map((p: { perk: { slug: string } }) => p.perk.slug));
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
      if (res.ok) setConnectedNode(selectedNode.id);
    } catch (e) { console.error("Connect failed:", e); }
  };

  const handleDisconnect = async () => {
    if (!connectedNode) return;
    try {
      await fetch("/api/disconnect", { method: "POST", headers: { "Content-Type": "application/json" } });
      setConnectedNode(null);
    } catch (e) { console.error("Disconnect failed:", e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredNodes = nodes.filter((n) => n.status !== "maintenance");

  if (view === "list") {
    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-foreground">Locations</h1>
          <button
            onClick={() => setView("map")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-xs font-medium text-foreground hover:bg-muted/80"
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
        <div className="space-y-1">
          {filteredNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${isLocked(node) ? "bg-zinc-600" : node.status === "online" ? "bg-emerald-500" : node.status === "high_load" ? "bg-yellow-500" : "bg-zinc-600"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{node.city}</p>
                  <p className="text-[11px] text-muted-foreground">{node.country} &middot; {node.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{node.loadPercent}%</span>
                {isLocked(node) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Locked</span>}
              </div>
            </button>
          ))}
        </div>
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

  return (
    <div className="absolute inset-0 -m-6">
      <WorldMap
        nodes={filteredNodes}
        userPlan={userPlan}
        userPerks={userPerks}
        onNodeSelect={(node) => setSelectedNode(node)}
      />
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border text-xs font-medium text-foreground hover:bg-muted/80"
        >
          <List className="h-3.5 w-3.5" />
          List
        </button>
      </div>
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
