import type { ServerStatus, Device } from "@/types";
import { getProductionStatus, restartWireGuard, reloadWireGuard } from "./commands";
import { getDemoStatus, demoRestart, demoReload } from "./demo";
import {
  getServer,
  getDevices as storeGetDevices,
  getActivity,
  addActivity,
  updateDevice as storeUpdateDevice,
  deleteDevice as storeDeleteDevice,
  addDevice as storeAddDevice,
  getNextIp,
} from "../storage";
import { generateKeyPair, generatePresharedKey } from "../security";
import type { DeviceFormData } from "@/types";

function isDemoMode(): boolean {
  return (process.env.VPN_MODE || "demo") === "demo";
}

export async function getServerStatus(): Promise<ServerStatus> {
  if (isDemoMode()) return getDemoStatus();
  return getProductionStatus();
}

export async function restartVpn(): Promise<{
  success: boolean;
  message: string;
}> {
  if (isDemoMode()) return demoRestart();
  return restartWireGuard();
}

export async function reloadVpn(): Promise<{
  success: boolean;
  message: string;
}> {
  if (isDemoMode()) return demoReload();
  return reloadWireGuard();
}

export async function createDevice(data: DeviceFormData): Promise<Device> {
  const server = await getServer();
  const keys = generateKeyPair();
  const psk = generatePresharedKey();
  const nextIp = await getNextIp();

  const device: Device = {
    id: crypto.randomUUID(),
    name: data.name,
    platform: data.platform,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    presharedKey: psk,
    assignedIp: nextIp,
    enabled: true,
    notes: data.notes || "",
    planRequired: "free",
    vpnServerId: server.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastHandshake: null,
    uploadBytes: 0,
    downloadBytes: 0,
    status: "inactive",
  };

  await storeAddDevice(device);

  await addActivity({
    id: crypto.randomUUID(),
    deviceId: device.id,
    type: "device_created",
    message: `Device "${device.name}" was registered`,
    metadata: JSON.stringify({ platform: device.platform }),
    createdAt: new Date().toISOString(),
  });

  return device;
}

export async function rotateDeviceKeys(
  id: string
): Promise<Device | null> {
  const keys = generateKeyPair();
  const psk = generatePresharedKey();
  const updated = await storeUpdateDevice(id, {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    presharedKey: psk,
  });
  if (updated) {
    await addActivity({
      id: crypto.randomUUID(),
      deviceId: id,
      type: "key_rotated",
      message: `Keys rotated for "${updated.name}"`,
      metadata: "{}",
      createdAt: new Date().toISOString(),
    });
  }
  return updated;
}

export async function toggleDevice(id: string): Promise<Device | null> {
  const device = await storeGetDevices().then((ds) =>
    ds.find((d) => d.id === id)
  );
  if (!device) return null;
  const updated = await storeUpdateDevice(id, { enabled: !device.enabled });
  if (updated) {
    await addActivity({
      id: crypto.randomUUID(),
      deviceId: id,
      type: updated.enabled ? "device_enabled" : "device_disabled",
      message: `Device "${updated.name}" was ${updated.enabled ? "enabled" : "disabled"}`,
      metadata: "{}",
      createdAt: new Date().toISOString(),
    });
  }
  return updated;
}

export async function removeDevice(id: string): Promise<boolean> {
  const device = await storeGetDevices().then((ds) =>
    ds.find((d) => d.id === id)
  );
  if (!device) return false;
  const deleted = await storeDeleteDevice(id);
  if (deleted) {
    await addActivity({
      id: crypto.randomUUID(),
      deviceId: null,
      type: "device_deleted",
      message: `Device "${device.name}" was deleted`,
      metadata: JSON.stringify({ platform: device.platform }),
      createdAt: new Date().toISOString(),
    });
  }
  return deleted;
}

export { storeGetDevices as getDevices, getActivity, getServer };
