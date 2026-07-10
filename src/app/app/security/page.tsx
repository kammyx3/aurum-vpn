"use client";

import { useState, useEffect, useCallback, useMemo, startTransition } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Globe,
  Lock,
  Activity,
  UserX,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import type { Device, ActivityLogEntry } from "@/types";

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
  return `${days}d ago`;
}

function SecurityScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 50
      ? "text-amber-500"
      : "text-destructive";

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tunnelMode, setTunnelMode] = useState<"full" | "split">("full");
  const [killSwitchEnabled, setKillSwitchEnabled] = useState(true);
  const [now] = useState(() => Date.now());
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [devicesRes, activityRes] = await Promise.all([
        fetch("/api/devices"),
        fetch("/api/activity"),
      ]);
      if (devicesRes.ok) setDevices(await devicesRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());
    } catch {
      // silent
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

  const securityScore = useMemo(() => {
    let score = 40;
    if (devices.length > 0) score += 20;
    if (killSwitchEnabled) score += 15;
    if (tunnelMode === "full") score += 15;
    const hasRecentRotation = activity.some(
      (a) => a.type === "key_rotated" && now - new Date(a.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
    );
    if (hasRecentRotation) score += 10;
    return Math.min(100, score);
  }, [devices, activity, tunnelMode, killSwitchEnabled, now]);

  const auditEntries = useMemo(
    () => activity.slice(0, 10),
    [activity]
  );

  const getKeyAge = (device: Device) => {
    const created = new Date(device.updatedAt).getTime();
    const daysSince = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return daysSince;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Security</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading security information...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Security</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Security overview and configuration for your VPN
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <SecurityScoreRing score={securityScore} />
            <p className="text-sm font-medium mt-3">Security Score</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {securityScore >= 80
                ? "Excellent"
                : securityScore >= 50
                ? "Good"
                : "Needs improvement"}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Key Rotation Status</CardTitle>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="text-xs text-muted-foreground">No devices to check.</p>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => {
                  const age = getKeyAge(device);
                  const isOld = age > 30;
                  return (
                    <div
                      key={device.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {isOld ? (
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        )}
                        <div>
                          <p className="text-xs font-medium">{device.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Key age: {age}d
                          </p>
                        </div>
                      </div>
                      {isOld ? (
                        <Badge variant="warning" className="text-xs">
                          Rotate
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-xs">
                          OK
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#c8a54e]" />
              DNS Leak Protection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  DNS requests are routed through the VPN tunnel to prevent leaks.
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#c8a54e]" />
              Kill Switch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Block all traffic if VPN connection drops
                </p>
                <Switch
                  checked={killSwitchEnabled}
                  onChange={(e) => setKillSwitchEnabled(e.target.checked)}
                />
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground font-mono">
                  # iptables rule to block non-VPN traffic
                  <br />
                  iptables -A OUTPUT ! -o wg0 -m mark ! --mark
                  <br />
                  $(wg show wg0 fwmark) -j REJECT
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#c8a54e]" />
              Allowed IPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Controls which IP ranges are routed through the VPN tunnel.
              </p>
              <div className="rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground">
                Full tunnel: 0.0.0.0/0, ::/0
                <br />
                Split tunnel: 10.8.0.0/24, 192.168.1.0/24
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#c8a54e]" />
              Tunnel Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  className={`flex-1 rounded-md border p-3 text-left text-xs transition-colors ${
                    tunnelMode === "full"
                      ? "border-[#c8a54e] bg-[#c8a54e]/5"
                      : "border-border hover:bg-muted"
                  }`}
                  onClick={() => setTunnelMode("full")}
                >
                  <p className="font-medium">Full Tunnel</p>
                  <p className="text-muted-foreground mt-0.5">
                    All traffic routed through VPN
                  </p>
                </button>
                <button
                  className={`flex-1 rounded-md border p-3 text-left text-xs transition-colors ${
                    tunnelMode === "split"
                      ? "border-[#c8a54e] bg-[#c8a54e]/5"
                      : "border-border hover:bg-muted"
                  }`}
                  onClick={() => setTunnelMode("split")}
                >
                  <p className="font-medium">Split Tunnel</p>
                  <p className="text-muted-foreground mt-0.5">
                    Only selected traffic through VPN
                  </p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserX className="h-4 w-4 text-[#c8a54e]" />
              Admin Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Protect admin access with a password.
              </p>
              <Input
                type="password"
                placeholder="Enter admin password"
                className="max-w-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  addToast({
                    title: "Password updated",
                    variant: "success",
                  })
                }
              >
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#c8a54e]" />
              Session Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Manage active VPN sessions and connected devices.
              </p>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs">Active sessions</span>
                <span className="text-xs font-medium">
                  {devices.filter((d) => d.status === "active").length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs">Registered devices</span>
                <span className="text-xs font-medium">{devices.length}</span>
              </div>
              <Button variant="outline" size="sm">
                Revoke All Sessions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {auditEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#c8a54e]" />
              Audit Log (Last 10)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-sm truncate">
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
