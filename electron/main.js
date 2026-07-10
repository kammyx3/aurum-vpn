const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, dialog } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");

const isDev = !app.isPackaged;
const PORT = 3000;
const PRODUCTION_URL = "https://aurum-vpn.vercel.app";
let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#09090b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "..", "public", "icons", process.platform === "win32" ? "icon.ico" : "icon.png"),
    show: false,
  });

  const url = isDev ? `http://localhost:${PORT}` : PRODUCTION_URL;

  mainWindow.loadURL(url);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window-maximize-change", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window-maximize-change", false);
  });

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconSize = 16;
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "AURUM VPN",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Show Dashboard",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Connect VPN",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send("vpn-connect");
        }
      },
    },
    {
      label: "Disconnect VPN",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send("vpn-disconnect");
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("AURUM VPN");
  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── IPC Handlers ─── Window Controls ───

ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("window-close", () => mainWindow?.close());

ipcMain.handle("window-is-maximized", () => mainWindow?.isMaximized() ?? false);

// ─── Auto-Updater ───

let autoUpdater = null;

function setupAutoUpdater() {
  if (isDev) return;

  try {
    const { autoUpdater: updater } = require("electron-updater");
    autoUpdater = updater;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("update-available", (info) => {
      if (mainWindow) {
        mainWindow.webContents.send("updater:update-available", {
          version: info.version,
          releaseDate: info.releaseDate,
        });
      }
    });

    autoUpdater.on("download-progress", (progress) => {
      if (mainWindow) {
        mainWindow.webContents.send("updater:download-progress", {
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
        });
      }
    });

    autoUpdater.on("update-downloaded", (info) => {
      if (mainWindow) {
        mainWindow.webContents.send("updater:update-downloaded", {
          version: info.version,
        });
      }
    });

    autoUpdater.on("error", (err) => {
      console.error("Auto-updater error:", err.message);
      if (mainWindow) {
        mainWindow.webContents.send("updater:error", err.message);
      }
    });
  } catch (err) {
    console.error("Failed to load electron-updater:", err.message);
  }
}

ipcMain.on("updater:check", () => {
  if (autoUpdater) {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error("Check for updates failed:", err.message);
      mainWindow?.webContents.send("updater:error", err.message);
    });
  }
});

ipcMain.on("updater:install", () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall(false, true);
  }
});

// ─── IPC Handlers ─── WireGuard System Integration ───

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: "utf-8", timeout: 15000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
}

function isWindows() {
  return process.platform === "win32";
}

function isLinux() {
  return process.platform === "linux";
}

ipcMain.handle("wg:install-check", async () => {
  try {
    if (isWindows()) {
      await runCommand('where wg');
      return { installed: true, platform: "windows" };
    }
    if (isLinux()) {
      await runCommand("which wg");
      return { installed: true, platform: "linux" };
    }
    if (process.platform === "darwin") {
      await runCommand("which wg");
      return { installed: true, platform: "macos" };
    }
    return { installed: false, platform: process.platform };
  } catch {
    return { installed: false, platform: process.platform };
  }
});

ipcMain.handle("wg:genkey", async () => {
  try {
    const key = await runCommand("wg genkey");
    return { success: true, key };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("wg:pubkey", async (_event, privateKey) => {
  try {
    const pub = await runCommand(`echo "${privateKey}" | wg pubkey`);
    return { success: true, key: pub };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("wg:genpsk", async () => {
  try {
    const key = await runCommand("wg genpsk");
    return { success: true, key };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("wg:show", async (_event, interfaceName) => {
  try {
    const output = await runCommand(`wg show ${interfaceName || "wg0"}`);
    return { success: true, output };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("wg:add-peer", async (_event, interfaceName, publicKey, allowedIPs) => {
  try {
    await runCommand(`wg set ${interfaceName} peer ${publicKey} allowed-ips ${allowedIPs}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("wg:remove-peer", async (_event, interfaceName, publicKey) => {
  try {
    await runCommand(`wg set ${interfaceName} peer ${publicKey} remove`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("wg:bring-up", async (_event, interfaceName) => {
  try {
    if (isWindows()) {
      await runCommand(`wireguard /installtunnelservice "${interfaceName}"`);
    } else {
      await runCommand(`sudo wg-quick up ${interfaceName}`);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("wg:bring-down", async (_event, interfaceName) => {
  try {
    if (isWindows()) {
      await runCommand(`wireguard /uninstalltunnelservice ${interfaceName}`);
    } else {
      await runCommand(`sudo wg-quick down ${interfaceName}`);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("wg:status", async (_event, interfaceName) => {
  try {
    const name = interfaceName || "wg0";
    const output = await runCommand(`wg show ${name}`);
    const lines = output.split("\n");
    const peers = lines.filter((l) => l.startsWith("peer:")).length;
    const listening = !lines.some((l) => l.includes("Unable to access interface"));
    return {
      success: true,
      status: {
        interfaceName: name,
        listening,
        peerCount: peers,
        raw: output,
      },
    };
  } catch {
    return {
      success: true,
      status: {
        interfaceName: interfaceName || "wg0",
        listening: false,
        peerCount: 0,
        raw: "",
      },
    };
  }
});

ipcMain.handle("wg:write-config", async (_event, interfaceName, configContent) => {
  try {
    const configDir = isWindows()
      ? path.join(process.env.ALLUSERSPROFILE || "C:\\ProgramData", "WireGuard")
      : "/etc/wireguard";
    const configPath = path.join(configDir, `${interfaceName}.conf`);
    fs.writeFileSync(configPath, configContent, "utf-8");
    return { success: true, path: configPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ─── IPC Handlers ─── System Info ───

ipcMain.handle("sys:platform", () => process.platform);
ipcMain.handle("sys:hostname", () => require("os").hostname());
ipcMain.handle("sys:open-external", async (_event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle("sys:open-file-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "WireGuard Config", extensions: ["conf"] }],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle("sys:read-file", async (_event, filePath) => {
  try {
    return { success: true, content: fs.readFileSync(filePath, "utf-8") };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ─── App Lifecycle ───

app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();
  createTray();

  setTimeout(() => {
    if (autoUpdater) {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error("Startup update check failed:", err.message);
      });
    }
  }, 3000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
});
