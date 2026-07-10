"use client";

import { useState, useEffect, useCallback, useMemo, startTransition } from "react";
import { Activity, Filter, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { ActivityLogEntry, Device } from "@/types";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getTypeBadge(type: string) {
  switch (type) {
    case "device_created":
      return <Badge variant="secondary">Created</Badge>;
    case "device_deleted":
      return <Badge variant="destructive">Deleted</Badge>;
    case "device_enabled":
      return <Badge variant="success">Enabled</Badge>;
    case "device_disabled":
      return <Badge variant="warning">Disabled</Badge>;
    case "key_rotated":
      return <Badge variant="warning">Key Rotated</Badge>;
    case "connected":
      return <Badge variant="success">Connected</Badge>;
    case "disconnected":
      return <Badge variant="default">Disconnected</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [activityRes, devicesRes] = await Promise.all([
        fetch("/api/activity"),
        fetch("/api/devices"),
      ]);
      if (!activityRes.ok || !devicesRes.ok) throw new Error("Failed to load data");
      const activityData = await activityRes.json();
      const devicesData = await devicesRes.json();
      setActivity(activityData);
      setDevices(devicesData);
    } catch {
      setError("Failed to load activity log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      await fetchData();
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [fetchData]);

  const getDeviceName = (deviceId: string | null) => {
    if (!deviceId) return "System";
    const device = devices.find((d) => d.id === deviceId);
    return device?.name ?? "Unknown";
  };

  const typeOptions = useMemo(() => {
    const types = new Set(activity.map((e) => e.type));
    return Array.from(types).map((t) => ({ value: t, label: t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }));
  }, [activity]);

  const filtered = useMemo(() => {
    return activity.filter((entry) => {
      if (deviceFilter !== "all" && entry.deviceId !== deviceFilter) return false;
      if (typeFilter !== "all" && entry.type !== typeFilter) return false;
      return true;
    });
  }, [activity, deviceFilter, typeFilter]);

  const deviceOptions = [
    { value: "all", label: "All Devices" },
    ...devices.map((d) => ({ value: d.id, label: d.name })),
  ];
  const allTypeOptions = [{ value: "all", label: "All Types" }, ...typeOptions];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading activity...</p>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-1">View all device and system events</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              className="mt-3 text-xs text-[#c8a54e] hover:underline"
              onClick={() => { setLoading(true); fetchData(); }}
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">View all device and system events</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filter:</span>
        </div>
        <Select
          options={deviceOptions}
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={allTypeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <h3 className="text-sm font-medium text-foreground">No activity</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {activity.length === 0
                ? "No events have been recorded yet."
                : "No events match the current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(entry.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-[#c8a54e]" />
                        {getDeviceName(entry.deviceId)}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(entry.type)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {entry.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
