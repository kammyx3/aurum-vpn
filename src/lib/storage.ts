import { prisma } from "./prisma";
import type { Device, VpnServer, ActivityLogEntry } from "@/types";

function serializeServer(
  s: Awaited<ReturnType<typeof prisma.vpnServer.findFirst>> &
    Record<string, unknown>
): VpnServer {
  return {
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
  };
}

function serializeDevice(
  d: Awaited<ReturnType<typeof prisma.device.findUnique>> &
    Record<string, unknown>
): Device {
  return {
    ...d,
    uploadBytes: Number(d.uploadBytes),
    downloadBytes: Number(d.downloadBytes),
    lastHandshake: d.lastHandshake
      ? d.lastHandshake instanceof Date
        ? d.lastHandshake.toISOString()
        : String(d.lastHandshake)
      : null,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt),
    status: !d.enabled
      ? "disabled"
      : d.lastHandshake &&
        new Date(d.lastHandshake).getTime() > Date.now() - 5 * 60 * 1000
        ? ("active" as const)
        : ("inactive" as const),
  };
}

function serializeActivity(
  a: Awaited<ReturnType<typeof prisma.activityLog.findFirst>> &
    Record<string, unknown>
): ActivityLogEntry {
  return {
    ...a,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
  };
}

export async function getServer(): Promise<VpnServer> {
  const server = await prisma.vpnServer.findFirst();
  if (!server) {
    const created = await prisma.vpnServer.create({
      data: {
        id: "srv-001",
        name: "AURUM VPN Server",
        mode: "demo",
        interfaceName: "wg0",
        endpointHost: "vpn.example.com",
        listenPort: 51820,
        subnet: "10.8.0.0/24",
        dns: "1.1.1.1",
        mtu: 1420,
        publicKey: "",
        status: "online",
        region: "us-east-1",
      },
    });
    return serializeServer(created);
  }
  return serializeServer(server);
}

export async function updateServer(
  updates: Partial<VpnServer>
): Promise<VpnServer> {
  const server = await getServer();
  const updated = await prisma.vpnServer.update({
    where: { id: server.id },
    data: updates,
  });
  return serializeServer(updated);
}

export async function getDevices(): Promise<Device[]> {
  const devices = await prisma.device.findMany({
    orderBy: { createdAt: "desc" },
  });
  return devices.map((d) => serializeDevice(d));
}

export async function getDevice(
  id: string
): Promise<Device | null> {
  const d = await prisma.device.findUnique({ where: { id } });
  if (!d) return null;
  return serializeDevice(d);
}

export async function addDevice(data: Device): Promise<Device> {
  const created = await prisma.device.create({
    data: {
      id: data.id,
      name: data.name,
      platform: data.platform,
      publicKey: data.publicKey,
      privateKey: data.privateKey,
      presharedKey: data.presharedKey,
      assignedIp: data.assignedIp,
      enabled: data.enabled,
      notes: data.notes,
      planRequired: data.planRequired,
      vpnServerId: data.vpnServerId,
      lastHandshake: data.lastHandshake
        ? new Date(data.lastHandshake)
        : null,
      uploadBytes: BigInt(data.uploadBytes),
      downloadBytes: BigInt(data.downloadBytes),
    },
  });
  return serializeDevice(created);
}

export async function updateDevice(
  id: string,
  updates: Partial<Device>
): Promise<Device | null> {
  const d = await prisma.device.findUnique({ where: { id } });
  if (!d) return null;

  const prismaUpdates: Record<string, unknown> = { ...updates };
  if (updates.uploadBytes !== undefined) {
    prismaUpdates.uploadBytes = BigInt(updates.uploadBytes);
  }
  if (updates.downloadBytes !== undefined) {
    prismaUpdates.downloadBytes = BigInt(updates.downloadBytes);
  }
  if (updates.lastHandshake !== undefined) {
    prismaUpdates.lastHandshake = updates.lastHandshake
      ? new Date(updates.lastHandshake)
      : null;
  }

  const updated = await prisma.device.update({
    where: { id },
    data: prismaUpdates,
  });
  return serializeDevice(updated);
}

export async function deleteDevice(id: string): Promise<boolean> {
  try {
    await prisma.device.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getActivity(): Promise<ActivityLogEntry[]> {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return logs.map((l) => serializeActivity(l));
}

export async function addActivity(
  entry: ActivityLogEntry
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      id: entry.id,
      deviceId: entry.deviceId,
      type: entry.type,
      message: entry.message,
      metadata: entry.metadata,
    },
  });
}

export async function getSettings(): Promise<{
  id: string;
  theme: string;
  plan: string;
  data: string;
}> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) {
    return prisma.appSettings.create({
      data: { id: "singleton", theme: "system", plan: "free", data: "{}" },
    });
  }
  return settings;
}

export async function updateSettings(updates: {
  theme?: string;
  plan?: string;
}): Promise<{
  id: string;
  theme: string;
  plan: string;
  data: string;
}> {
  return prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: updates,
    create: { id: "singleton", ...updates, data: "{}" },
  });
}

export async function resetStore(): Promise<void> {
  await prisma.activityLog.deleteMany();
  await prisma.device.deleteMany();
  await prisma.usageSample.deleteMany();
  await prisma.auditLog.deleteMany();
}

export async function getTotalUpload(): Promise<number> {
  const result = await prisma.device.aggregate({
    _sum: { uploadBytes: true },
  });
  return Number(result._sum.uploadBytes || 0);
}

export async function getTotalDownload(): Promise<number> {
  const result = await prisma.device.aggregate({
    _sum: { downloadBytes: true },
  });
  return Number(result._sum.downloadBytes || 0);
}

export async function getNextIp(): Promise<string> {
  const devices = await prisma.device.findMany({
    select: { assignedIp: true },
  });
  let max = 1;
  for (const d of devices) {
    const match = d.assignedIp.match(/10\.8\.0\.(\d+)/);
    if (match) max = Math.max(max, parseInt(match[1]));
  }
  return `10.8.0.${max + 1}`;
}

export async function findUser(
  username: string
): Promise<{
  id: string;
  username: string;
  password: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  return prisma.user.findUnique({ where: { username } });
}
