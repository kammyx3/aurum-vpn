"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import {
  Lock,
  Shield,
  RotateCcw,
  RefreshCw,
  Activity,
  Users,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Globe,
  Wifi,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export default function AdminPage() {
  const { user, setUser, logout: storeLogout } = useAppStore();
  const [authenticated, setAuthenticated] = useState(!!user);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setAuthenticated(true);
        }
      } catch {
        // not logged in
      }
    });
  }, [setUser]);

  const fetchStatus = useCallback(async () => {
    if (!authenticated) return;
    try {
      const res = await fetch("/api/server/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // silent
    }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    startTransition(async () => {
      await fetchStatus();
    });
  }, [authenticated, fetchStatus]);

  const handleAuthenticate = async () => {
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed");
        addToast({ title: "Authentication failed", variant: "error" });
        return;
      }
      setUser(data.user);
      setAuthenticated(true);
    } catch {
      setAuthError("Connection error");
      addToast({ title: "Authentication failed", variant: "error" });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    storeLogout();
    setAuthenticated(false);
    setPassword("");
  };

  const handleRestart = async () => {
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

  const handleResetAll = async () => {
    setShowResetConfirm(false);
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      if (res.ok) {
        addToast({ title: "All data has been reset", variant: "success" });
        fetchStatus();
      }
    } catch {
      addToast({ title: "Failed to reset data", variant: "error" });
    }
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c8a54e]/10 mb-3">
                <Shield className="h-6 w-6 text-[#c8a54e]" />
              </div>
              <h1 className="text-lg font-semibold">Admin Access</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the admin password to continue
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setAuthError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAuthenticate();
                    }}
                    placeholder="Enter admin password"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                {authError && (
                  <p className="text-xs text-destructive">{authError}</p>
                )}
              </div>
              <Button className="w-full" onClick={handleAuthenticate}>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Authenticate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System administration and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Badge variant="outline" className="text-xs">
              {user.username}
            </Badge>
          )}
          <Badge variant="success">
            <Shield className="h-3 w-3 mr-1" />
            Authenticated
          </Badge>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
              <div className="flex items-center gap-1.5">
                {status.running ? (
                  <span className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Running
                  </span>
                ) : (
                  <span className="text-sm font-medium text-zinc-400">Stopped</span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Endpoint</p>
              </div>
              <p className="text-sm font-medium truncate">{status.endpoint || "N/A"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Peers</p>
              </div>
              <p className="text-sm font-medium">{status.peerCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
              <p className="text-sm font-medium">{status.uptime || "N/A"}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={restarting}
              onClick={handleRestart}
            >
              {restarting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Restart VPN
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={reloading}
              onClick={handleReload}
            >
              {reloading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Reload Config
            </Button>
            <Button variant="outline" size="sm" onClick={fetchStatus}>
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {status?.events && status.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Server Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {status.events.map((event, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground py-1.5 border-b border-border last:border-0"
                >
                  <Activity className="h-3 w-3 mt-0.5 shrink-0 text-[#c8a54e]" />
                  <span className="break-all">{event}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Reset All Data</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete all devices, configs, and activity logs
              </p>
            </div>
            <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Reset All Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all data including devices, configurations,
                    activity logs, and settings. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleResetAll}>
                    Yes, Reset Everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
