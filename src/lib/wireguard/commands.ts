import { execSync } from "child_process";
import type { ServerStatus } from "@/types";
import { getServer, updateServer } from "../storage";

const SAFE_CMD_WHITELIST = [
  "wg show",
  "wg showconf",
  "systemctl status wg-quick@",
  "systemctl restart wg-quick@",
  "systemctl reload wg-quick@",
];

function isSafeCommand(cmd: string): boolean {
  return SAFE_CMD_WHITELIST.some((safe) => cmd.startsWith(safe));
}

function runCommand(cmd: string): string {
  if (!isSafeCommand(cmd)) {
    throw new Error(`Command not in whitelist: ${cmd}`);
  }
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

export async function getProductionStatus(): Promise<ServerStatus> {
  const server = await getServer();
  const interfaceName = server.interfaceName;
  let installed = false;
  let running = false;
  let peerCount = 0;
  const uptime = "unknown";
  const events: string[] = [];

  try {
    const statusOutput = runCommand(
      `systemctl is-active wg-quick@${interfaceName}`
    );
    running = statusOutput === "active";
    installed = true;
  } catch {
    installed = false;
  }

  if (running) {
    try {
      const showOutput = runCommand(`wg show ${interfaceName}`);
      const peerMatches = showOutput.match(/peer:/g);
      peerCount = peerMatches ? peerMatches.length : 0;
      events.push("WireGuard interface is active");
    } catch {
      events.push("Could not read WireGuard status");
    }
  }

  return {
    installed,
    running,
    interfaceName: server.interfaceName,
    listeningPort: server.listenPort,
    endpoint: server.endpointHost,
    publicKey: server.publicKey,
    subnet: server.subnet,
    dns: server.dns,
    mtu: server.mtu,
    peerCount,
    uptime,
    mode: "production",
    events,
  };
}

export async function restartWireGuard(): Promise<{
  success: boolean;
  message: string;
}> {
  const server = await getServer();
  try {
    runCommand(`systemctl restart wg-quick@${server.interfaceName}`);
    await updateServer({ status: "online" });
    return { success: true, message: "WireGuard restarted successfully" };
  } catch (e) {
    return { success: false, message: `Failed to restart: ${String(e)}` };
  }
}

export async function reloadWireGuard(): Promise<{
  success: boolean;
  message: string;
}> {
  const server = await getServer();
  try {
    runCommand(`systemctl reload wg-quick@${server.interfaceName}`);
    return { success: true, message: "WireGuard config reloaded" };
  } catch (e) {
    return { success: false, message: `Failed to reload: ${String(e)}` };
  }
}

export async function addPeer(
  publicKey: string,
  allowedIPs: string
): Promise<{ success: boolean; message: string }> {
  const server = await getServer();
  if (!publicKey.match(/^[A-Za-z0-9+/]{43,44}=$/)) {
    return { success: false, message: "Invalid public key format" };
  }
  try {
    runCommand(
      `wg set ${server.interfaceName} peer ${publicKey} allowed-ips ${allowedIPs}`
    );
    return { success: true, message: "Peer added" };
  } catch (e) {
    return { success: false, message: `Failed to add peer: ${String(e)}` };
  }
}

export async function removePeer(
  publicKey: string
): Promise<{ success: boolean; message: string }> {
  const server = await getServer();
  try {
    runCommand(
      `wg set ${server.interfaceName} peer ${publicKey} remove`
    );
    return { success: true, message: "Peer removed" };
  } catch (e) {
    return { success: false, message: `Failed to remove peer: ${String(e)}` };
  }
}

export async function disablePeer(
  publicKey: string
): Promise<{ success: boolean; message: string }> {
  const server = await getServer();
  try {
    runCommand(
      `wg set ${server.interfaceName} peer ${publicKey} remove`
    );
    return {
      success: true,
      message: "Peer disabled (removed from interface)",
    };
  } catch (e) {
    return { success: false, message: `Failed to disable peer: ${String(e)}` };
  }
}

export async function enablePeer(
  publicKey: string,
  allowedIPs: string
): Promise<{ success: boolean; message: string }> {
  return addPeer(publicKey, allowedIPs);
}
