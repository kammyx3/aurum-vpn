"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Wifi, WifiOff, AlertTriangle, Lock, Loader2 } from "lucide-react";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

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

const statusColors: Record<string, string> = {
  online: "#22c55e",
  high_load: "#eab308",
  maintenance: "#f97316",
  offline: "#ef4444",
  locked: "#6b7280",
};

const tierBadges: Record<string, string> = {
  free: "bg-zinc-700 text-zinc-300",
  basic: "bg-blue-900/50 text-blue-300",
  plus: "bg-purple-900/50 text-purple-300",
  pro: "bg-amber-900/50 text-amber-300",
  business: "bg-red-900/50 text-red-300",
};

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0"
      style={{ backgroundColor: statusColors[status] || statusColors.offline }}
    />
  );
}

function NodeMarker({ node, onClick, isLocked }: { node: VpnNode; onClick: () => void; isLocked: boolean }) {
  const color = isLocked ? statusColors.locked : (statusColors[node.status] || statusColors.offline);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      // @ts-expect-error leaflet type quirk
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setL(leaflet);
    });
  }, []);

  if (!L) return null;

  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 18px; height: 18px; border-radius: 50%;
      background: ${color};
      border: 3px solid ${isLocked ? "#374151" : "#1f2937"};
      box-shadow: 0 0 8px ${color}44;
      cursor: pointer;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  return (
    <Marker
      position={[node.latitude, node.longitude]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="text-xs space-y-1 min-w-[180px]">
          <div className="font-semibold text-sm">{node.city}, {node.countryCode}</div>
          <div className="text-zinc-500">{node.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <StatusDot status={isLocked ? "locked" : node.status} />
            <span className="capitalize">{isLocked ? "Locked" : node.status.replace("_", " ")}</span>
            <span className="text-zinc-400">|</span>
            <span>{node.loadPercent}% load</span>
          </div>
          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${tierBadges[node.tier] || tierBadges.free}`}>
            {node.tier}
          </span>
        </div>
      </Popup>
    </Marker>
  );
}

export default function WorldMap({
  nodes,
  userPlan,
  userPerks,
  onNodeSelect,
}: {
  nodes: VpnNode[];
  userPlan: string;
  userPerks: string[];
  onNodeSelect: (node: VpnNode) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    import("leaflet").then((leaflet) => setL(leaflet));
  }, []);

  const isNodeLocked = useCallback((node: VpnNode) => {
    if (!node.requiredPlanSlug || node.requiredPlanSlug === "free") return false;
    const requiredPerks: string[] = JSON.parse(node.requiredPerkSlugs || "[]");
    const hasRequiredPerks = requiredPerks.every((p) => userPerks.includes(p));
    return node.requiredPlanSlug !== userPlan || !hasRequiredPerks;
  }, [userPlan, userPerks]);

  if (!mounted || !L) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="h-full w-full rounded-lg"
      zoomControl={true}
      scrollWheelZoom={true}
      style={{ background: "#09090b" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {nodes.map((node) => (
        <NodeMarker
          key={node.id}
          node={node}
          isLocked={isNodeLocked(node)}
          onClick={() => onNodeSelect(node)}
        />
      ))}
    </MapContainer>
  );
}
