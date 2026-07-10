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

  // Auto-updater
  updater: {
    checkForUpdates: () => ipcRenderer.send("updater:check"),
    installUpdate: () => ipcRenderer.send("updater:install"),
    onUpdateAvailable: (callback) => ipcRenderer.on("updater:update-available", callback),
    onDownloadProgress: (callback) => ipcRenderer.on("updater:download-progress", callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on("updater:update-downloaded", callback),
    onUpdateError: (callback) => ipcRenderer.on("updater:error", callback),
  },

  // System
  platform: () => ipcRenderer.invoke("sys:platform"),
  hostname: () => ipcRenderer.invoke("sys:hostname"),
  openExternal: (url) => ipcRenderer.invoke("sys:open-external", url),
  openFileDialog: () => ipcRenderer.invoke("sys:open-file-dialog"),
  readFile: (path) => ipcRenderer.invoke("sys:read-file", path),

  // VPN events from tray
  onVpnConnect: (callback) => ipcRenderer.on("vpn-connect", () => callback()),
  onVpnDisconnect: (callback) => ipcRenderer.on("vpn-disconnect", () => callback()),
});
