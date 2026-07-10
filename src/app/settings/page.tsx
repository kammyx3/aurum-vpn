"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import {
  Save,
  RotateCcw,
  Download,
  Trash2,
  Loader2,
  Lock,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/stores/appStore";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SettingsData {
  theme: string;
  plan: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [endpoint, setEndpoint] = useState("");
  const [interfaceName, setInterfaceName] = useState("wg0");
  const [subnet, setSubnet] = useState("10.8.0.0/24");
  const [dns, setDns] = useState("1.1.1.1, 8.8.8.8");
  const [allowedIps, setAllowedIps] = useState("0.0.0.0/0, ::/0");
  const [mtu, setMtu] = useState("1420");
  const { addToast } = useToast();
  const { plan, setPlan, vpnMode } = useAppStore();

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setPlan(data.plan as "free" | "premium");
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [setPlan]);

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      await fetchSettings();
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, theme: settings?.theme ?? "system" }),
      });
      if (res.ok) {
        addToast({ title: "Settings saved", variant: "success" });
      } else {
        addToast({ title: "Failed to save settings", variant: "error" });
      }
    } catch {
      addToast({ title: "Failed to save settings", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      if (res.ok) {
        addToast({ title: "Demo data loaded", variant: "success" });
        fetchSettings();
      }
    } catch {
      addToast({ title: "Failed to load demo data", variant: "error" });
    }
  };

  const handleResetAll = async () => {
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      if (res.ok) {
        addToast({ title: "All data has been reset", variant: "success" });
        setPlan("free");
        fetchSettings();
      }
    } catch {
      addToast({ title: "Failed to reset data", variant: "error" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading settings...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your AURUM VPN application
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1.5" />
          )}
          Save Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-xs font-medium">App Name</p>
              <p className="text-xs text-muted-foreground">The name displayed in the sidebar</p>
            </div>
            <Badge variant="outline">AURUM VPN</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-xs font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Choose your preferred appearance</p>
            </div>
            <div className="flex items-center gap-1">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    settings?.theme === t
                      ? "bg-[#c8a54e]/10 text-[#c8a54e]"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSettings((s) => (s ? { ...s, theme: t } : s))}
                >
                  {t === "light" && <Sun className="h-3 w-3" />}
                  {t === "dark" && <Moon className="h-3 w-3" />}
                  {t === "system" && <Monitor className="h-3 w-3" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-medium">VPN Mode</p>
              <p className="text-xs text-muted-foreground">
                Current operating mode (read-only)
              </p>
            </div>
            <Badge variant={vpnMode === "demo" ? "premium" : "success"}>
              {vpnMode === "demo" ? "Demo" : "Production"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">WireGuard Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Endpoint Hostname</label>
            <p className="text-xs text-muted-foreground">
              The public hostname or IP of your VPN server
            </p>
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="vpn.example.com"
              className="max-w-md"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Interface Name</label>
              <p className="text-xs text-muted-foreground">WireGuard interface</p>
              <Input
                value={interfaceName}
                onChange={(e) => setInterfaceName(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">VPN Subnet</label>
              <p className="text-xs text-muted-foreground">IP range for peers</p>
              <Input
                value={subnet}
                onChange={(e) => setSubnet(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">DNS Servers</label>
              <p className="text-xs text-muted-foreground">Comma-separated DNS resolvers</p>
              <Input
                value={dns}
                onChange={(e) => setDns(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Default MTU</label>
              <p className="text-xs text-muted-foreground">Maximum transmission unit</p>
              <Input
                value={mtu}
                onChange={(e) => setMtu(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Default Allowed IPs</label>
            <p className="text-xs text-muted-foreground">
              IP ranges routed through the tunnel (for new devices)
            </p>
            <Input
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Developer / Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-xs font-medium">Free / Premium Toggle</p>
              <p className="text-xs text-muted-foreground">
                Switch plan for testing (local only)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {plan === "premium" ? "Premium" : "Free"}
              </span>
              <Switch
                checked={plan === "premium"}
                onChange={() => setPlan(plan === "free" ? "premium" : "free")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-xs font-medium">Load Demo Data</p>
              <p className="text-xs text-muted-foreground">
                Reset and reload all demo data
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLoadDemo}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Load Demo Data
            </Button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-xs font-medium">Export Settings</p>
              <p className="text-xs text-muted-foreground">
                Export your configuration (premium only)
              </p>
            </div>
            {plan === "premium" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  addToast({ title: "Export coming soon", variant: "default" })
                }
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Premium Only
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-medium">Reset All Data</p>
              <p className="text-xs text-muted-foreground">
                Delete all devices, configs, and activity
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Reset All
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Reset all data?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all devices, configurations, and activity logs.
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleResetAll}>
                    Reset Everything
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
