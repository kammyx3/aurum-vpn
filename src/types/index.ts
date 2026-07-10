export type PlanType = "free" | "premium";

export interface Device {
  id: string;
  name: string;
  platform: string;
  publicKey: string;
  privateKey: string;
  presharedKey: string;
  assignedIp: string;
  enabled: boolean;
  notes: string;
  planRequired: string;
  vpnServerId: string;
  createdAt: string;
  updatedAt: string;
  lastHandshake: string | null;
  uploadBytes: number;
  downloadBytes: number;
  status: "active" | "inactive" | "disabled";
}

export interface VpnServer {
  id: string;
  name: string;
  mode: string;
  interfaceName: string;
  endpointHost: string;
  listenPort: number;
  subnet: string;
  dns: string;
  mtu: number;
  publicKey: string;
  status: string;
  region: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  deviceId: string | null;
  type: string;
  message: string;
  metadata: string;
  createdAt: string;
}

export interface UsageSample {
  id: string;
  deviceId: string;
  uploadBytes: number;
  downloadBytes: number;
  recordedAt: string;
}

export interface AppSettings {
  id: string;
  theme: string;
  plan: string;
  data: string;
}

export interface AuditLog {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface ServerStatus {
  installed: boolean;
  running: boolean;
  interfaceName: string;
  listeningPort: number;
  endpoint: string;
  publicKey: string;
  subnet: string;
  dns: string;
  mtu: number;
  peerCount: number;
  uptime: string;
  mode: string;
  events: string[];
}

export interface WireGuardConfig {
  interface: {
    privateKey: string;
    address: string;
    dns: string;
    mtu?: number;
  };
  peer: {
    publicKey: string;
    presharedKey?: string;
    endpoint: string;
    allowedIPs: string;
    persistentKeepalive?: number;
  };
}

export interface DeviceFormData {
  name: string;
  platform: string;
  notes?: string;
}

export interface RegionCard {
  id: string;
  name: string;
  country: string;
  city: string;
  status: "available" | "coming-soon" | "premium-only";
  latency?: number;
  flag?: string;
}
