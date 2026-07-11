"use client";

import { useState } from "react";
import { X, Wifi, WifiOff, Lock, Unlock, Star, ArrowUpCircle, Download, Shield } from "lucide-react";

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
  tags: string;
  protocols: string;
  currentUsers: number;
  maxUsers: number;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  online: { label: "Online", color: "text-emerald-500" },
  high_load: { label: "High Load", color: "text-yellow-500" },
  maintenance: { label: "Maintenance", color: "text-orange-500" },
  offline: { label: "Offline", color: "text-red-500" },
};

const tierLabels: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  plus: "Plus",
  pro: "Pro",
  business: "Business",
};

export default function NodeDrawer({
  node,
  isLocked,
  isConnected,
  onClose,
  onConnect,
  onDisconnect,
  onUpgrade,
}: {
  node: VpnNode;
  isLocked: boolean;
  isConnected: boolean;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onUpgrade: () => void;
}) {
  const [favorite, setFavorite] = useState(false);
  const status = statusConfig[node.status] || statusConfig.offline;
  const tags: string[] = JSON.parse(node.tags || "[]");
  const protocols: string[] = JSON.parse(node.protocols || "[]");
  const loadColor = node.loadPercent > 80 ? "text-red-500" : node.loadPercent > 60 ? "text-yellow-500" : "text-emerald-500";

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-zinc-800 shadow-2xl overflow-y-auto">
      <div className="sticky top-0 bg-card border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#c8a54e]" />
          <span className="text-sm font-semibold text-zinc-100">{node.name}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-zinc-300 hover:bg-zinc-800">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">{node.city}</h2>
            <p className="text-sm text-muted-foreground">{node.country} &middot; {node.countryCode}</p>
            <p className="text-xs text-muted-foreground">{node.region}</p>
          </div>
          <button onClick={() => setFavorite(!favorite)} className={`p-1.5 rounded-md transition-colors ${favorite ? "text-[#c8a54e]" : "text-muted-foreground hover:text-zinc-400"}`}>
            <Star className="h-4 w-4" fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-medium ${status.color}`}>
            {node.status === "online" ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {status.label}
          </span>
          <span>|</span>
          <span className={`text-xs font-medium ${loadColor}`}>{node.loadPercent}% Load</span>
          <span>|</span>
          <span className="text-xs text-zinc-400">{node.latencyMs}ms</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 capitalize">{node.tier}</span>
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 capitalize">{tag}</span>
          ))}
          {protocols.map((p) => (
            <span key={p} className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-900/30 text-blue-300 uppercase">{p}</span>
          ))}
        </div>

        <div className="border-t border-zinc-800 pt-4 space-y-3">
          {isLocked ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <Lock className="h-4 w-4 text-[#c8a54e]" />
                <div>
                  <p className="text-xs font-medium text-zinc-200">Upgrade required</p>
                  <p className="text-[11px] text-muted-foreground">
                    This node requires the <strong className="text-[#c8a54e]">{tierLabels[node.requiredPlanSlug] || node.requiredPlanSlug}</strong> plan
                  </p>
                </div>
              </div>
              <button
                onClick={onUpgrade}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#c8a54e] hover:bg-[#b8963e] text-black text-sm font-semibold transition-colors"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Upgrade to {tierLabels[node.requiredPlanSlug] || node.requiredPlanSlug}
              </button>
            </div>
          ) : isConnected ? (
            <button
              onClick={onDisconnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
            >
              <WifiOff className="h-4 w-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#c8a54e] hover:bg-[#b8963e] text-black text-sm font-semibold transition-colors"
            >
              <Wifi className="h-4 w-4" />
              Connect to {node.city}
            </button>
          )}
        </div>

        <div className="border-t border-zinc-800 pt-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Current users</span>
            <span className="text-zinc-300">{node.currentUsers} / {node.maxUsers}</span>
          </div>
          <div className="flex justify-between">
            <span>Protocols</span>
            <span className="text-zinc-300">{protocols.join(", ").toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
