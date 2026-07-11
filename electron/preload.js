const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
  onMaximizeChange: (callback) => {
    ipcRenderer.on("window-maximize-change", (_e, maximized) => callback(maximized));
  },

  // WireGuard system commands
  wg: {
    installCheck: () => ipcRenderer.invoke("wg:install-check"),
    genkey: () => ipcRenderer.invoke("wg:genkey"),
    pubkey: (privateKey) => ipcRenderer.invoke("wg:pubkey", privateKey),
    genpsk: () => ipcRenderer.invoke("wg:genpsk"),
    show: (iface) => ipcRenderer.invoke("wg:show", iface),
    addPeer: (iface, pubKey, allowedIPs) => ipcRenderer.invoke("wg:add-peer", iface, pubKey, allowedIPs),
    removePeer: (iface, pubKey) => ipcRenderer.invoke("wg:remove-peer", iface, pubKey),
    bringUp: (iface) => ipcRenderer.invoke("wg:bring-up", iface),
    bringDown: (iface) => ipcRenderer.invoke("wg:bring-down", iface),
    status: (iface) => ipcRenderer.invoke("wg:status", iface),
    writeConfig: (iface, content) => ipcRenderer.invoke("wg:write-config", iface, content),
  },

  // Notifications from main process
  onUpdateStatus: (callback) => ipcRenderer.on("updater:status", (_e, msg) => callback(msg)),

  // System
  platform: () => ipcRenderer.invoke("sys:platform"),
  hostname: () => ipcRenderer.invoke("sys:hostname"),
  openExternal: (url) => ipcRenderer.invoke("sys:open-external", url),
  openFileDialog: () => ipcRenderer.invoke("sys:open-file-dialog"),
  readFile: (path) => ipcRenderer.invoke("sys:read-file", path),

  // VPN events from tray
  onVpnConnect: (callback) => ipcRenderer.on("vpn-connect", () => callback()),
  onVpnDisconnect: (callback) => ipcRenderer.on("vpn-disconnect", () => callback()),

  // Splash screen
  splash: {
    onStatus: (callback) => ipcRenderer.on("splash-status", (_e, msg) => callback(msg)),
    onProgress: (callback) => ipcRenderer.on("splash-progress", (_e, pct) => callback(pct)),
    onError: (callback) => ipcRenderer.on("splash-error", (_e, title, desc) => callback(title, desc)),
    onDone: (callback) => ipcRenderer.on("splash-done", () => callback()),
    retry: () => ipcRenderer.send("splash-retry"),
    continue: () => ipcRenderer.send("splash-continue"),
  },
});
