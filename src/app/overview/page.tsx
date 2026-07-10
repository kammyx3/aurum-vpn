"use client";

import { useEffect, useState } from "react";
import { Monitor, ArrowUp, ArrowDown, Activity, Plus, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatBytes } from "@/lib/utils";
import type { Device, ServerStatus } from "@/types";

interface TrafficPoint {
  hour: string;
  upload: number;
  download: number;
}

function generateTrafficData(): TrafficPoint[] {
  const data: TrafficPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date();
    d.setHours(d.getHours() - i);
    const label = d.getHours().toString().padStart(2, "0") + ":00";
    data.push({
      hour: label,
      upload: Math.round(Math.random() * 80 + 10),
      download: Math.round(Math.random() * 150 + 30),
    });
  }
  return data;
}

export default function OverviewPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverLoading, setServerLoading] = useState(true);
  const [trafficData] = useState<TrafficPoint[]>(generateTrafficData);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [devRes, srvRes] = await Promise.all([
          fetch("/api/devices"),
          fetch("/api/server/status"),
        ]);
        if (devRes.ok && !cancelled) {
          setDevices(await devRes.json());
        }
        if (srvRes.ok && !cancelled) {
          setServerStatus(await srvRes.json());
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) {
          setLoading(false);
          setServerLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const refreshAll = async () => {
    try {
      const [devRes, srvRes] = await Promise.all([
        fetch("/api/devices"),
        fetch("/api/server/status"),
      ]);
      if (devRes.ok) setDevices(await devRes.json());
      if (srvRes.ok) setServerStatus(await srvRes.json());
    } catch {
      // silent
    }
  };

  const enabledCount = devices.filter((d) => d.enabled).length;
  const totalUpload = devices.reduce((sum, d) => sum + d.uploadBytes, 0);
  const totalDownload = devices.reduce((sum, d) => sum + d.downloadBytes, 0);

  const recentDevices = [...devices]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: "VPN Status",
      value: serverLoading ? "..." : serverStatus?.running ? "Online" : "Offline",
      icon: serverStatus?.running ? Wifi : WifiOff,
      color: serverStatus?.running ? "text-emerald-500" : "text-zinc-400",
      bg: serverStatus?.running ? "bg-emerald-500/10" : "bg-zinc-500/10",
    },
    {
      title: "Connected Devices",
      value: `${enabledCount} / ${devices.length}`,
      icon: Monitor,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Total Upload",
      value: formatBytes(totalUpload),
      icon: ArrowUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Download",
      value: formatBytes(totalDownload),
      icon: ArrowDown,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Monitor your VPN network at a glance</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    {loading && stat.title !== "VPN Status" ? (
                      <Skeleton className="h-7 w-20 mt-1" />
                    ) : serverLoading && stat.title === "VPN Status" ? (
                      <Skeleton className="h-7 w-20 mt-1" />
                    ) : (
                      <p className="text-2xl font-semibold text-foreground mt-1">{stat.value}</p>
                    )}
                  </div>
                  <div className={`p-2 rounded-md ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                {stat.title === "VPN Status" && !serverLoading && serverStatus && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${serverStatus.running ? "bg-emerald-500" : "bg-zinc-400"}`} />
                    <span className="text-xs text-muted-foreground">
                      {serverStatus.running ? "Running" : "Stopped"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Traffic (Last 24h)</CardTitle>
            <CardDescription>Upload and download in MB</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c8a54e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c8a54e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="text-muted-foreground" interval={3} />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.375rem",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="upload" stroke="#c8a54e" fill="url(#uploadGrad)" name="Upload" strokeWidth={2} />
                  <Area type="monotone" dataKey="download" stroke="#10b981" fill="url(#downloadGrad)" name="Download" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Server Info</CardTitle>
            <CardDescription>Current server configuration</CardDescription>
          </CardHeader>
          <CardContent>
            {serverLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : serverStatus ? (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interface</span>
                  <span className="font-mono text-xs">{serverStatus.interfaceName}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endpoint</span>
                  <span className="font-mono text-xs">{serverStatus.endpoint}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subnet</span>
                  <span className="font-mono text-xs">{serverStatus.subnet}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DNS</span>
                  <span className="font-mono text-xs">{serverStatus.dns}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span>{serverStatus.uptime}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peers</span>
                  <span>{serverStatus.peerCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mode</span>
                  <Badge variant={serverStatus.mode === "production" ? "default" : "secondary"} className="text-[10px]">
                    {serverStatus.mode}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unable to load server status.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Recent Device Activity</CardTitle>
            <CardDescription>Last 5 updated devices</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/devices"}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentDevices.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No devices yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.href = "/devices"}>
                <Plus className="h-4 w-4 mr-1" />
                Add Device
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Handshake</TableHead>
                  <TableHead>Upload</TableHead>
                  <TableHead>Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>
                      <Badge variant={device.enabled ? (device.status === "active" ? "success" : "secondary") : "outline"}>
                        {device.enabled ? device.status : "disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {device.lastHandshake
                        ? new Date(device.lastHandshake).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-xs">{formatBytes(device.uploadBytes)}</TableCell>
                    <TableCell className="text-xs">{formatBytes(device.downloadBytes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
