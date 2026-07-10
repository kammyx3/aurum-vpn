"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import {
  Lock,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";

interface Region {
  id: string;
  name: string;
  country: string;
  city: string;
  flag: string;
  status: "available" | "coming-soon" | "premium-only";
  latency: number;
}

const REGIONS: Region[] = [
  { id: "us-east", name: "US East", country: "United States", city: "Virginia", flag: "\ud83c\uddfa\ud83c\uddf8", status: "available", latency: 12 },
  { id: "eu-west", name: "EU West", country: "Netherlands", city: "Amsterdam", flag: "\ud83c\uddf3\ud83c\uddf1", status: "coming-soon", latency: 45 },
  { id: "apac", name: "Asia Pacific", country: "Singapore", city: "Singapore", flag: "\ud83c\uddf8\ud83c\uddfc", status: "premium-only", latency: 85 },
  { id: "us-west", name: "US West", country: "United States", city: "California", flag: "\ud83c\uddfa\ud83c\uddf8", status: "coming-soon", latency: 28 },
  { id: "eu-central", name: "EU Central", country: "Germany", city: "Frankfurt", flag: "\ud83c\udde9\ud83c\uddea", status: "premium-only", latency: 52 },
];

function getStatusConfig(status: Region["status"]) {
  switch (status) {
    case "available":
      return { badge: <Badge variant="success">Active</Badge> };
    case "coming-soon":
      return { badge: <Badge variant="outline">Coming Soon</Badge> };
    case "premium-only":
      return { badge: <Badge variant="premium"><Lock className="h-2.5 w-2.5 mr-1 inline" />Premium</Badge> };
  }
}

export default function RegionsPage() {
  const [currentRegion, setCurrentRegion] = useState<string>("us-east");
  const plan = useAppStore((s) => s.plan);

  const fetchServerRegion = useCallback(async () => {
    try {
      const res = await fetch("/api/server/status");
      if (res.ok) {
        const data = await res.json();
        if (data.endpoint) {
          if (data.endpoint.includes("us-east")) setCurrentRegion("us-east");
          else if (data.endpoint.includes("eu-west")) setCurrentRegion("eu-west");
          else if (data.endpoint.includes("apac")) setCurrentRegion("apac");
          else if (data.endpoint.includes("us-west")) setCurrentRegion("us-west");
          else if (data.endpoint.includes("eu-central")) setCurrentRegion("eu-central");
        }
      }
    } catch {
      // keep default
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      fetchServerRegion();
    });
  }, [fetchServerRegion]);

  const current = REGIONS.find((r) => r.id === currentRegion);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Server Regions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a server location for your VPN connection
        </p>
      </div>

      {current && (
        <Card className="border-[#c8a54e]/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c8a54e]/10 text-2xl">
                  {current.flag}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Current Region</p>
                  <h2 className="text-lg font-semibold">
                    {current.name} &mdash; {current.city}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {current.country}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                  <Zap className="h-3 w-3" />
                  <span>{current.latency}ms</span>
                </div>
                <Badge variant="success" className="mt-1">
                  Connected
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REGIONS.map((region) => {
          const config = getStatusConfig(region.status);
          const isCurrent = region.id === currentRegion;

          return (
            <Card
              key={region.id}
              className={`transition-all ${
                isCurrent
                  ? "border-[#c8a54e]/50 ring-1 ring-[#c8a54e]/20"
                  : region.status === "premium-only" && plan === "free"
                  ? "opacity-75"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{region.flag}</span>
                    <div>
                      <p className="text-sm font-medium">{region.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {region.city}, {region.country}
                      </p>
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {config.badge}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {region.latency}ms
                  </div>
                </div>

                {region.status !== "available" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {region.status === "coming-soon"
                      ? "This region will be available in a future update."
                      : "Upgrade to Premium to access this region."}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
