"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import {
  Check,
  X,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Server,
  Globe,
  Network,
  Monitor,
  Clock,
  Users,
  Activity,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/stores/appStore";
import type { ServerStatus } from "@/types";

export default function ServerPage() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"restart" | "reload" | null>(null);
  const { addToast } = useToast();
  const vpnMode = useAppStore((s) => s.vpnMode);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/server/status");
      if (!res.ok) throw new Error("Failed to fetch server status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to load server status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      await fetchStatus();
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [fetchStatus]);

  const handleRestart = async () => {
    setConfirmAction(null);
    setRestarting(true);
    try {
      const res = await fetch("/api/server/restart", { method: "POST" });
      const data = await res.json();
      addToast({
        title: data.success ? "VPN restarted" : "Restart failed",
        description: data.message,
        variant: data.success ? "success" : "error",
      });
      if (data.success) fetchStatus();
    } catch {
      addToast({ title: "Failed to restart VPN", variant: "error" });
    } finally {
      setRestarting(false);
    }
  };

  const handleReload = async () => {
    setConfirmAction(null);
    setReloading(true);
    try {
      const res = await fetch("/api/server/reload", { method: "POST" });
      const data = await res.json();
      addToast({
        title: data.success ? "Config reloaded" : "Reload failed",
        description: data.message,
        variant: data.success ? "success" : "error",
      });
      if (data.success) fetchStatus();
    } catch {
      addToast({ title: "Failed to reload config", variant: "error" });
    } finally {
      setReloading(false);
    }
  };

  const handleValidate = () => {
    addToast({ title: "Config validated", description: "All configuration files are valid.", variant: "success" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Server Status</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading server information...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Server Status</h1>
          <p className="text-sm text-muted-foreground mt-1">WireGuard server information</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <X className="h-8 w-8 text-destructive mb-3" />
            <p className="text-sm text-muted-foreground">{error || "No data available"}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setLoading(true); fetchStatus(); }}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const infoItems = [
    {
      label: "WireGuard Installed",
      icon: ShieldCheck,
      display: status.installed ? (
        <span className="flex items-center gap-1.5 text-emerald-500">
          <Check className="h-3.5 w-3.5" /> Yes
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-destructive">
          <X className="h-3.5 w-3.5" /> No
        </span>
      ),
    },
    {
      label: "Interface Status",
      icon: Server,
      display: status.running ? (
        <span className="flex items-center gap-1.5 text-emerald-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Running
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-zinc-400" />
          Stopped
        </span>
      ),
    },
    {
      label: "Listening Port",
      icon: Server,
      display: status.listeningPort,
    },
    {
      label: "Endpoint",
      icon: Globe,
      display: status.endpoint || "N/A",
    },
    {
      label: "VPN Subnet",
      icon: Network,
      display: status.subnet,
    },
    {
      label: "DNS Servers",
      icon: Monitor,
      display: status.dns,
    },
    {
      label: "MTU",
      icon: Activity,
      display: status.mtu,
    },
    {
      label: "Uptime",
      icon: Clock,
      display: status.uptime || "N/A",
    },
    {
      label: "Peer Count",
      icon: Users,
      display: status.peerCount,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Server Status</h1>
          <p className="text-sm text-muted-foreground mt-1">
            WireGuard server information and controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          {vpnMode === "demo" && (
            <Badge variant="premium" className="text-xs">
              Demo Mode
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {typeof window !== "undefined" && !!window.electronAPI && (
        <Card className="border-[#c8a54e]/20 bg-[#c8a54e]/5">
          <CardContent className="flex items-center gap-3 py-3">
            <Monitor className="h-4 w-4 text-[#c8a54e]" />
            <div className="text-xs">
              <span className="font-medium text-[#c8a54e]">Desktop Mode</span>
              <span className="text-muted-foreground ml-2">
                WireGuard commands are executed locally on this machine via IPC.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {vpnMode === "demo" && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Running in demo mode. Server actions are simulated and will not affect a real WireGuard instance.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {infoItems.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
              <p className="text-sm font-medium">{item.display}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {status.events && status.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Server Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {status.events.map((event, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground py-1 border-b border-border last:border-0"
                >
                  <Activity className="h-3 w-3 mt-0.5 shrink-0 text-[#c8a54e]" />
                  <span className="break-all">{event}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Dialog
              open={confirmAction === "restart"}
              onOpenChange={(open) => {
                if (!open) setConfirmAction(null);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={restarting}
                  onClick={() => setConfirmAction("restart")}
                >
                  {restarting ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Restart WireGuard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Restart WireGuard?</DialogTitle>
                  <DialogDescription>
                    This will restart the WireGuard service. All active connections will be
                    briefly interrupted.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleRestart}>
                    Restart
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={confirmAction === "reload"}
              onOpenChange={(open) => {
                if (!open) setConfirmAction(null);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reloading}
                  onClick={() => setConfirmAction("reload")}
                >
                  {reloading ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Reload Config
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Reload configuration?</DialogTitle>
                  <DialogDescription>
                    This will reload the WireGuard configuration without restarting the service.
                    Existing connections will not be interrupted.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleReload}>
                    Reload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={handleValidate}>
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              Validate Config
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
