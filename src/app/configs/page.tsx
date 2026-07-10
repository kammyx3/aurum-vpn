"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import {
  Download,
  Eye,
  Copy,
  QrCode,
  FileText,
  AlertTriangle,
  Shield,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { Device } from "@/types";

interface ConfigEntry {
  id: string;
  name: string;
  config: string;
}

function getStatusBadge(status: Device["status"]) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "inactive":
      return <Badge variant="secondary">Inactive</Badge>;
    case "disabled":
      return <Badge variant="warning">Disabled</Badge>;
  }
}

export default function ConfigsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<ConfigEntry | null>(null);
  const [qrConfig, setQrConfig] = useState<ConfigEntry | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [devicesRes, configsRes] = await Promise.all([
        fetch("/api/devices"),
        fetch("/api/configs"),
      ]);
      if (!devicesRes.ok || !configsRes.ok) throw new Error("Failed to load data");
      const devicesData = await devicesRes.json();
      const configsData = await configsRes.json();
      setDevices(devicesData);
      setConfigs(configsData);
    } catch {
      setError("Failed to load configurations. Please try again.");
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
    return () => {
      active = false;
    };
  }, [fetchData]);

  const getDeviceForConfig = (configId: string) =>
    devices.find((d) => d.id === configId);

  const handleCopy = async (config: ConfigEntry) => {
    try {
      await navigator.clipboard.writeText(config.config);
      setCopiedId(config.id);
      addToast({ title: "Config copied to clipboard", variant: "success" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast({ title: "Failed to copy config", variant: "error" });
    }
  };

  const handleDownload = (device: Device, configText: string) => {
    const safe = device.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filename = `aurum-vpn-${safe}.conf`;
    const blob = new Blob([configText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({ title: `Downloaded ${filename}`, variant: "success" });
  };

  const handleShowQR = async (config: ConfigEntry) => {
    setQrConfig(config);
    setQrImage(null);
    setQrLoading(true);
    try {
      const res = await fetch(`/api/devices/${config.id}/qr`);
      if (res.ok) {
        const data = await res.json();
        setQrImage(data.qrcode);
      } else {
        addToast({ title: "Failed to generate QR code", variant: "error" });
      }
    } catch {
      addToast({ title: "Failed to generate QR code", variant: "error" });
    } finally {
      setQrLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">VPN Configurations</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading configurations...</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">VPN Configurations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your WireGuard configuration files</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <X className="h-8 w-8 text-destructive mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setLoading(true); fetchData(); }}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">VPN Configurations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and download your WireGuard configuration files
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Treat configuration files like passwords. They grant full access to your VPN.
          Never share them publicly.
        </p>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <h3 className="text-sm font-medium text-foreground">No configurations</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add a device to generate its VPN configuration file.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => {
            const device = getDeviceForConfig(config.id);
            if (!device) return null;
            return (
              <Card key={config.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Shield className="h-5 w-5 text-[#c8a54e]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{device.name}</p>
                        {getStatusBadge(device.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {device.platform} &middot; {device.assignedIp}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedConfig(config)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Configuration: {device.name}</DialogTitle>
                          <DialogDescription>
                            WireGuard client configuration file content
                          </DialogDescription>
                        </DialogHeader>
                        <div className="p-4">
                          <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-80 overflow-y-auto">
                            {config.config}
                          </pre>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (selectedConfig) handleCopy(selectedConfig);
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(device, config.config)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopy(config)}
                    >
                      {copiedId === config.id ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(device, config.config)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Dialog
                      open={qrConfig?.id === config.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setQrConfig(null);
                          setQrImage(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleShowQR(config)}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>QR Code: {device.name}</DialogTitle>
                          <DialogDescription>
                            Scan with the WireGuard mobile app
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-center py-6">
                          {qrLoading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          ) : qrImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={qrImage}
                              alt={`QR code for ${device.name}`}
                              className="rounded-lg"
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Failed to generate QR code
                            </p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQrConfig(null);
                              setQrImage(null);
                            }}
                          >
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
