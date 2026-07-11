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

// Mercator projection: [lon, lat] => [x, y] in pixel coords
function project(lon: number, lat: number, w: number, h: number) {
  const x = ((lon + 180) / 360) * w;
  const mercN = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const y = h / 2 - (w * mercN) / (2 * Math.PI);
  return { x, y };
}

// Convert GeoJSON coordinate ring to SVG path string
function ringToPath(ring: number[][], w: number, h: number) {
  if (!ring || ring.length < 2) return "";
  return ring
    .map((p, i) => {
      const { x, y } = project(p[0], p[1], w, h);
      return (i === 0 ? `M${x},${y}` : `L${x},${y}`) + (p.length > 2 ? ` ${p[2]}` : "");
    })
    .join("") + "Z";
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
  const [paths, setPaths] = useState<string[]>([]);

  // Load world outline from world-atlas TopoJSON
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        const tr = topo.transform;
        const arcs = topo.arcs;
        const geos = topo.objects.countries.geometries;

        // Decode a single arc index to lon/lat coords
        function decodeArc(idx: number): number[][] {
          const arc = arcs[idx >= 0 ? idx : ~idx];
          const coords: number[][] = [];
          let x = 0, y = 0;
          for (const [dx, dy] of arc) {
            x += dx;
            y += dy;
            coords.push([x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]]);
          }
          return idx < 0 ? coords.reverse() : coords;
        }

        const allRings: string[] = [];
        for (const geom of geos) {
          const polygons = geom.type === "MultiPolygon" ? geom.arcs : [geom.arcs];
          for (const polygon of polygons) {
            const ring: number[][] = [];
            for (const arcIdx of polygon) {
              ring.push(...decodeArc(arcIdx));
            }
            allRings.push(ringToPath(ring, dims.w, dims.h));
          }
        }
        setPaths(allRings);
      })
      .catch(() => {});
  }, [dims.w, dims.h]);

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [dragging, dragStart]
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const isNodeLocked = (node: VpnNode) => {
    if (!node.requiredPlanSlug || node.requiredPlanSlug === "free") return false;
    return node.requiredPlanSlug !== userPlan;
  };

  const { w, h } = dims;
  const cx = w / 2 + pan.x;
  const cy = h / 2 + pan.y;

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    const { x } = project(lon, 0, w, h);
    gridLines.push(<line key={`gl-${lon}`} x1={x} y1={0} x2={x} y2={h} stroke="var(--border)" strokeWidth={0.5} opacity={0.2} />);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const { y } = project(0, lat, w, h);
    gridLines.push(<line key={`gl-lat-${lat}`} x1={0} y1={y} x2={w} y2={y} stroke="var(--border)" strokeWidth={0.5} opacity={0.2} />);
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
        <g transform={`translate(${cx - (w / 2) * zoom}, ${cy - (h / 2) * zoom}) scale(${zoom})`}>
          <rect x={0} y={0} width={w} height={h} fill="transparent" />

          {gridLines}

          {/* Country outlines */}
          {paths.map((d, i) => (
            <path key={i} d={d} fill="var(--muted)" stroke="var(--border)" strokeWidth={0.3} />
          ))}

          {/* Node markers */}
          {(nodes || []).map((node) => {
            const locked = isNodeLocked(node);
            const color = locked ? statusColors.locked : statusColors[node.status] || statusColors.offline;
            const isHovered = hovered === node.id;
            const { x, y } = project(node.longitude, node.latitude, w, h);
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
                    <text x={0} y={-r - 6} textAnchor="middle" fill="var(--foreground)" fontSize={10} fontWeight={600}>
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
