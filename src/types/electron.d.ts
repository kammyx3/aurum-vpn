interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange?: (cb: (maximized: boolean) => void) => void;
  wg: {
    installCheck: () => Promise<{ installed: boolean; platform: string }>;
    genkey: () => Promise<{ success: boolean; key?: string; error?: string }>;
    pubkey: (pk: string) => Promise<{ success: boolean; key?: string; error?: string }>;
    genpsk: () => Promise<{ success: boolean; key?: string; error?: string }>;
    show: (iface: string) => Promise<{ success: boolean; output?: string; error?: string }>;
    addPeer: (iface: string, pk: string, ips: string) => Promise<{ success: boolean; error?: string }>;
    removePeer: (iface: string, pk: string) => Promise<{ success: boolean; error?: string }>;
    bringUp: (iface: string) => Promise<{ success: boolean; error?: string }>;
    bringDown: (iface: string) => Promise<{ success: boolean; error?: string }>;
    status: (iface: string) => Promise<{ success: boolean; status?: { interfaceName: string; listening: boolean; peerCount: number; raw: string }; error?: string }>;
    writeConfig: (iface: string, content: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  };
  onUpdateStatus?: (cb: (msg: string) => void) => void;
  platform: () => Promise<string>;
  hostname: () => Promise<string>;
  onVpnConnect: (cb: () => void) => void;
  onVpnDisconnect: (cb: () => void) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
