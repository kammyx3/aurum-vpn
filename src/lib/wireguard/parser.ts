import type { WireGuardConfig, Device, VpnServer } from "@/types";

export function buildClientConfig(
  device: Device,
  server: VpnServer,
  allowedIPs = "0.0.0.0/0,::/0"
): WireGuardConfig {
  return {
    interface: {
      privateKey: device.privateKey,
      address: `${device.assignedIp}/32`,
      dns: server.dns,
      mtu: server.mtu,
    },
    peer: {
      publicKey: server.publicKey,
      presharedKey: device.presharedKey || undefined,
      endpoint: `${server.endpointHost}:${server.listenPort}`,
      allowedIPs,
      persistentKeepalive: 25,
    },
  };
}

export function buildSplitTunnelConfig(
  device: Device,
  server: VpnServer,
  customAllowedIPs: string
): WireGuardConfig {
  return buildClientConfig(device, server, customAllowedIPs);
}
