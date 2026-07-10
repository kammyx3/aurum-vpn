"use client";

import { useEffect, useState } from "react";
import {
  Monitor, Smartphone, MoreHorizontal, Plus, Trash2, RotateCw, FileText,
  QrCode, Pencil, Download, Copy, Check, AlertTriangle, RefreshCw, Wifi,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/stores/appStore";
import { formatBytes } from "@/lib/utils";
import { canAddDevice } from "@/lib/planLimits";
import type { Device } from "@/types";

const PLATFORM_OPTIONS = [
  { value: "Windows", label: "Windows" },
  { value: "macOS", label: "macOS" },
  { value: "Linux", label: "Linux" },
  { value: "iOS", label: "iOS" },
  { value: "Android", label: "Android" },
];

function getPlatformIcon(platform: string) {
  const desktop = ["Windows", "macOS", "Linux"];
  return desktop.includes(platform) ? Monitor : Smartphone;
}

export default function DevicesPage() {
  const { addToast } = useToast();
  const plan = useAppStore((s) => s.plan);

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add device dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPlatform, setNewPlatform] = useState("Windows");
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Config dialog
  const [configOpen, setConfigOpen] = useState(false);
  const [configTarget, setConfigTarget] = useState<Device | null>(null);
  const [configText, setConfigText] = useState("");
  const [configLoading, setConfigLoading] = useState(false);
  const [configCopied, setConfigCopied] = useState(false);

  // QR dialog
  const [qrOpen, setQrOpen] = useState(false);
  const [qrTarget, setQrTarget] = useState<Device | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  // Rename dialog
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Device | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/devices");
      if (!res.ok) throw new Error("Failed to load devices");
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/devices");
        if (!res.ok) throw new Error("Failed to load devices");
        const data = await res.json();
        if (!cancelled) setDevices(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAddDevice = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), platform: newPlatform, notes: newNotes.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create device");
      await fetchDevices();
      setAddOpen(false);
      setNewName("");
      setNewPlatform("Windows");
      setNewNotes("");
      addToast({ title: "Device created", description: `${newName.trim()} has been added.`, variant: "success" });
    } catch (err) {
      addToast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create device", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/devices/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete device");
      await fetchDevices();
      setDeleteOpen(false);
      setDeleteTarget(null);
      addToast({ title: "Device deleted", description: `${deleteTarget.name} has been removed.`, variant: "success" });
    } catch (err) {
      addToast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete device", variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (device: Device) => {
    try {
      const res = await fetch(`/api/devices/${device.id}/toggle`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle device");
      await fetchDevices();
      addToast({
        title: device.enabled ? "Device disabled" : "Device enabled",
        description: `${device.name} is now ${device.enabled ? "disabled" : "enabled"}.`,
        variant: "success",
      });
    } catch (err) {
      addToast({ title: "Error", description: err instanceof Error ? err.message : "Failed to toggle device", variant: "error" });
    }
  };

  const handleRotateKeys = async (device: Device) => {
    try {
      const res = await fetch(`/api/devices/${device.id}/rotate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to rotate keys");
      await fetchDevices();
      addToast({ title: "Keys rotated", description: `Keys for ${device.name} have been rotated.`, variant: "success" });
    } catch (err) {
      addToast({ title: "Error", description: err instanceof Error ? err.message : "Failed to rotate keys", variant: "error" });
    }
  };

  const handleViewConfig = async (device: Device) => {
    setConfigTarget(device);
    setConfigOpen(true);
    setConfigText("");
    setConfigCopied(false);
    setConfigLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/config`);
      if (!res.ok) throw new Error("Failed to load config");
      const text = await res.text();
      setConfigText(text);
    } catch (err) {
      setConfigText("Failed to load configuration.");
      addToast({ title: "Error", description: err instanceof Error ? err.message : "Failed to load config", variant: "error" });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDownloadConfig = async (device: Device) => {
    try {
      const res = await fetch(`/api/devices/${device.id}/config`);
      if (!res.ok) throw new Error("Failed to load config");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${device.name.replace(/\s+/g, "-").toLowerCase()}.conf`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ title: "Config downloaded", variant: "success" });
    } catch (err) {
      addToast({ title: "Error", description: err instanceof Error ? err.message : "Failed to download config", variant: "error" });
    }
  };

  const handleViewQR = async (device: Device) => {
    setQrTarget(device);
    setQrOpen(true);
    setQrDataUrl("");
    setQrLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/qr`);
      if (!res.ok) throw new Error("Failed to load QR code");
      const data = await res.json();
      setQrDataUrl(data.qr || data);
    } catch (err) {
      addToast({ title: "Error", description: err instanceof Error ? err.message : "Failed to load QR code", variant: "error" });
    } finally {
      setQrLoading(false);
    }
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(configText);
      setConfigCopied(true);
      setTimeout(() => setConfigCopied(false), 2000);
      addToast({ title: "Copied to clipboard", variant: "success" });
    } catch {
      addToast({ title: "Failed to copy", variant: "error" });
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    setRenaming(true);
    try {
      const res = await fetch(`/api/devices/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename device");
      await fetchDevices();
      setRenameOpen(false);
      setRenameTarget(null);
      addToast({ title: "Device renamed", variant: "success" });
    } catch (err) {
      addToast({ title: "Error", description: err instanceof Error ? err.message : "Failed to rename device", variant: "error" });
    } finally {
      setRenaming(false);
    }
  };

  const canAdd = canAddDevice(plan, devices.length);
  const maxText = plan === "premium" ? "unlimited" : `${canAddDevice(plan, devices.length) ? devices.length : 2}/2`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Devices</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${devices.length} device${devices.length !== 1 ? "s" : ""} · ${maxText}${plan === "free" ? " on free plan" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDevices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!canAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Device</DialogTitle>
                <DialogDescription>Create a new VPN device configuration.</DialogDescription>
              </DialogHeader>
              <div className="p-4 space-y-4">
                {!canAdd && devices.length > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>You have reached the free plan limit. Upgrade to Premium for unlimited devices.</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Name</label>
                  <Input placeholder="e.g. MacBook Pro" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select options={PLATFORM_OPTIONS} value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Optional notes..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAddDevice} disabled={!newName.trim() || submitting}>
                  {submitting ? "Creating..." : "Create Device"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchDevices}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wifi className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No devices yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Add your first device to get started.</p>
            <Button size="sm" onClick={() => setAddOpen(true)} disabled={!canAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Handshake</TableHead>
                  <TableHead>Upload</TableHead>
                  <TableHead>Download</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const PlatformIcon = getPlatformIcon(device.platform);
                  return (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <PlatformIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs">{device.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{device.assignedIp}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={device.enabled}
                            onChange={() => handleToggle(device)}
                          />
                          <Badge
                            variant={
                              device.enabled
                                ? device.status === "active"
                                  ? "success"
                                  : "secondary"
                                : "outline"
                            }
                            className="text-[10px]"
                          >
                            {device.enabled ? device.status : "disabled"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {device.lastHandshake
                          ? new Date(device.lastHandshake).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-xs">{formatBytes(device.uploadBytes)}</TableCell>
                      <TableCell className="text-xs">{formatBytes(device.downloadBytes)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggle(device)}>
                              {device.enabled ? (
                                <>Disable</>
                              ) : (
                                <>Enable</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRotateKeys(device)}>
                              <RotateCw className="h-3.5 w-3.5 mr-2" />
                              Rotate Keys
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewConfig(device)}>
                              <FileText className="h-3.5 w-3.5 mr-2" />
                              View Config
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadConfig(device)}>
                              <Download className="h-3.5 w-3.5 mr-2" />
                              Download Config
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewQR(device)}>
                              <QrCode className="h-3.5 w-3.5 mr-2" />
                              QR Code
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setRenameTarget(device);
                                setRenameName(device.name);
                                setRenameOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteTarget(device);
                                setDeleteOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteDevice} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Configuration — {configTarget?.name}</DialogTitle>
            <DialogDescription>WireGuard client configuration file.</DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-0">
            {configLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="relative">
                <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto max-h-64 border border-border">
                  <code>{configText}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopyConfig}
                >
                  {configCopied ? (
                    <><Check className="h-3.5 w-3.5 mr-1" /> Copied</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
                  )}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDownloadConfig(configTarget!)} disabled={!configText || configLoading}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button onClick={() => setConfigOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code — {qrTarget?.name}</DialogTitle>
            <DialogDescription>Scan with the WireGuard mobile app.</DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-0 flex justify-center">
            {qrLoading ? (
              <Skeleton className="h-56 w-56" />
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="h-56 w-56" />
            ) : (
              <p className="text-sm text-muted-foreground">Failed to load QR code.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setQrOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Device</DialogTitle>
            <DialogDescription>Update the name of {renameTarget?.name}.</DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-0">
            <Input
              placeholder="New device name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!renameName.trim() || renaming}>
              {renaming ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
