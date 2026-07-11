"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type VpnNode = {
  id: string; name: string; city: string; country: string; countryCode: string;
  region: string; latitude: number; longitude: number; status: string;
  loadPercent: number; latencyMs: number; tier: string;
  requiredPlanSlug: string; requiredPerkSlugs: string; tags: string;
  protocols: string; currentUsers: number; maxUsers: number;
};

const statusColors: Record<string, string> = {
  online: "#22c55e", high_load: "#eab308", maintenance: "#f97316", offline: "#ef4444", locked: "#52525b",
};

function project(lon: number, lat: number, w: number, h: number) {
  const x = ((lon + 180) / 360) * w;
  const mercN = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const y = h / 2 - (w * mercN) / (2 * Math.PI);
  return { x, y };
}

export default function WorldMap({ nodes, userPlan, userPerks, onNodeSelect }: {
  nodes: VpnNode[]; userPlan: string; userPerks: string[]; onNodeSelect: (node: VpnNode) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [paths, setPaths] = useState<string[] | null>(null);

  // Load world outlines
  useEffect(() => {
    let cancelled = false;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (cancelled) return;
        const tr = topo.transform;
        const arcs: number[][][] = topo.arcs;
        const geos = topo.objects.countries.geometries;
        const result: string[] = [];

        for (const geom of geos) {
          const polygons = geom.type === "MultiPolygon" ? geom.arcs : [geom.arcs];
          for (const polygon of polygons) {
            const allCoords: number[][] = [];
            for (const arcIdx of polygon) {
              const arc = arcs[arcIdx >= 0 ? arcIdx : ~arcIdx];
              const coords: number[][] = [];
              let x = 0, y = 0;
              for (const [dx, dy] of arc) {
                x += dx; y += dy;
                coords.push([x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]]);
              }
              if (arcIdx < 0) coords.reverse();
              allCoords.push(...coords);
            }
            if (allCoords.length > 2) {
              const path = allCoords.map((p, i) => {
                const { x, y } = project(p[0], p[1], dims.w, dims.h);
                return (i === 0 ? `M${x},${y}` : `L${x},${y}`);
              }).join("") + "Z";
              result.push(path);
            }
          }
        }
        if (!cancelled) setPaths(result);
      })
      .catch(() => { if (!cancelled) setPaths([]); });
    return () => { cancelled = true; };
  }, [dims.w, dims.h]);

  // Resize
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
    setZoom((z) => Math.max(1, Math.min(8, z * (e.deltaY > 0 ? 0.9 : 1.1))));
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

  const isLocked = (node: VpnNode) => {
    if (!node.requiredPlanSlug || node.requiredPlanSlug === "free") return false;
    return node.requiredPlanSlug !== userPlan;
  };

  const { w, h } = dims;
  const cx = w / 2 + pan.x;
  const cy = h / 2 + pan.y;

  // Grid
  const grid: React.ReactNode[] = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    const { x } = project(lon, 0, w, h);
    grid.push(<line key={`gl${lon}`} x1={x} y1={0} x2={x} y2={h} stroke="var(--border)" strokeWidth={0.5} opacity={0.3} />);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const { y } = project(0, lat, w, h);
    grid.push(<line key={`la${lat}`} x1={0} y1={y} x2={w} y2={y} stroke="var(--border)" strokeWidth={0.5} opacity={0.3} />);
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-muted/30 overflow-hidden"
      onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <g transform={`translate(${cx - w/2*zoom}, ${cy - h/2*zoom}) scale(${zoom})`}>
          <rect x={0} y={0} width={w} height={h} fill="transparent" />
          {grid}

          {/* Landmass outlines */}
          {paths && paths.map((d, i) => (
            <path key={i} d={d} fill="var(--muted)" stroke="var(--border)" strokeWidth={0.5} />
          ))}

          {/* Dots */}
          {(nodes || []).map((node) => {
            const locked = isLocked(node);
            const color = locked ? statusColors.locked : (statusColors[node.status] || statusColors.offline);
            const isHovered = hovered === node.id;
            const { x, y } = project(node.longitude, node.latitude, w, h);
            const r = isHovered ? 9 : 6;

            return (
              <g key={node.id} transform={`translate(${x}, ${y})`}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onNodeSelect(node); }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Glow */}
                <circle cx={0} cy={0} r={r + 4} fill={color} opacity={0.2} />
                {/* Dot */}
                <circle cx={0} cy={0} r={r} fill={color} stroke="var(--background)" strokeWidth={2.5} />
                {/* Label on hover */}
                {isHovered && (
                  <text x={0} y={-r - 8} textAnchor="middle" fill="var(--foreground)" fontSize={11} fontWeight={600}>
                    {node.city}, {node.countryCode}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
