import QRCode from "qrcode";
import type { WireGuardConfig } from "@/types";

export function generateClientConfig(
  config: WireGuardConfig
): string {
  const lines: string[] = [];
  lines.push("[Interface]");
  lines.push(`PrivateKey = ${config.interface.privateKey}`);
  lines.push(`Address = ${config.interface.address}`);
  lines.push(`DNS = ${config.interface.dns}`);
  if (config.interface.mtu) {
    lines.push(`MTU = ${config.interface.mtu}`);
  }
  lines.push("");
  lines.push("[Peer]");
  lines.push(`PublicKey = ${config.peer.publicKey}`);
  if (config.peer.presharedKey) {
    lines.push(`PresharedKey = ${config.peer.presharedKey}`);
  }
  lines.push(`Endpoint = ${config.peer.endpoint}`);
  lines.push(`AllowedIPs = ${config.peer.allowedIPs}`);
  if (config.peer.persistentKeepalive) {
    lines.push(`PersistentKeepalive = ${config.peer.persistentKeepalive}`);
  }
  lines.push("");
  return lines.join("\n");
}

export async function generateQRCode(
  config: WireGuardConfig
): Promise<string> {
  const configText = generateClientConfig(config);
  try {
    const dataUrl = await QRCode.toDataURL(configText, {
      width: 256,
      margin: 2,
      color: {
        dark: "#1a1a1a",
        light: "#ffffff",
      },
    });
    return dataUrl;
  } catch {
    return "";
  }
}

export function getConfigFilename(deviceName: string): string {
  const safe = deviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `aurum-vpn-${safe}.conf`;
}
