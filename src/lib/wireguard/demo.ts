import type { ServerStatus } from "@/types";
import { getServer, getDevices, updateServer } from "../storage";

const demoStartTime = Date.now();

const demoEvents = [
  "WireGuard interface wg0 started",
  "Listening on 0.0.0.0:51820",
  "DNS configured: 1.1.1.1",
  "MTU set to 1420",
  "Firewall rules applied",
  "Service ready",
];

export async function getDemoStatus(): Promise<ServerStatus> {
  const server = await getServer();
  const devices = await getDevices();
  const elapsed = Date.now() - demoStartTime;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);

  return {
    installed: true,
    running: true,
    interfaceName: server.interfaceName,
    listeningPort: server.listenPort,
    endpoint: server.endpointHost,
    publicKey: server.publicKey,
    subnet: server.subnet,
    dns: server.dns,
    mtu: server.mtu,
    peerCount: devices.filter((d) => d.enabled).length,
    uptime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    mode: "demo",
    events: demoEvents,
  };
}

export async function demoRestart(): Promise<{
  success: boolean;
  message: string;
}> {
  await updateServer({ status: "online" });
  return { success: true, message: "WireGuard restarted (demo)" };
}

export async function demoReload(): Promise<{
  success: boolean;
  message: string;
}> {
  return { success: true, message: "WireGuard config reloaded (demo)" };
}
