"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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
  locked: "#52525b",
};

function lonLatToXY(lon: number, lat: number, width: number, height: number) {
  const x = ((lon + 180) / 360) * width;
  const mercN = Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 360)));
  const y = (height / 2) - (width * mercN / (2 * Math.PI));
  return { x, y };
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(1, Math.min(8, z * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const isNodeLocked = (node: VpnNode) => {
    if (!node.requiredPlanSlug || node.requiredPlanSlug === "free") return false;
    return node.requiredPlanSlug !== userPlan;
  };

  const { w, h } = dims;
  const cx = w / 2 + pan.x;
  const cy = h / 2 + pan.y;

  const gridLines = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    const { x } = lonLatToXY(lon, 0, w, h);
    gridLines.push(
      <line key={`gl-${lon}`} x1={x} y1={0} x2={x} y2={h} stroke="var(--border)" strokeWidth={0.5} opacity={0.3} />
    );
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const { y } = lonLatToXY(0, lat, w, h);
    gridLines.push(
      <line key={`gl-lat-${lat}`} x1={0} y1={y} x2={w} y2={y} stroke="var(--border)" strokeWidth={0.5} opacity={0.3} />
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-background overflow-hidden"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <g transform={`translate(${cx - w / 2 * zoom}, ${cy - h / 2 * zoom}) scale(${zoom})`}>
          <rect x={0} y={0} width={w} height={h} fill="transparent" />
          
          {gridLines}

          {(nodes || []).map((node) => {
            const locked = isNodeLocked(node);
            const color = locked ? statusColors.locked : (statusColors[node.status] || statusColors.offline);
            const isHovered = hovered === node.id;
            const { x, y } = lonLatToXY(node.longitude, node.latitude, w, h);
            const r = isHovered ? 8 : 5;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onNodeSelect(node); }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {isHovered && (
                  <>
                    <circle cx={0} cy={0} r={16} fill={color} opacity={0.12} />
                    <text
                      x={0}
                      y={-r - 6}
                      textAnchor="middle"
                      fill="var(--foreground)"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {node.city}
                    </text>
                  </>
                )}
                <circle cx={0} cy={0} r={r} fill={color} stroke="var(--background)" strokeWidth={2} />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
