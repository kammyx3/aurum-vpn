const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, dialog } = require("electron");
const path = require("path");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const https = require("https");

const isDev = !app.isPackaged;
const PORT = 3000;
const PRODUCTION_URL = "https://aurum-vpn-aurum10.vercel.app";
const UPDATE_API_URL = isDev
  ? "http://localhost:3000/api/app-update"
  : `${PRODUCTION_URL}/api/app-update`;

let mainWindow = null;
let splashWindow = null;
let tray = null;
let isQuitting = false;
let updateFilePath = null;

// ─── Splash Screen ───

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 460,
    frame: false,
    resizable: false,
    transparent: false,
    backgroundColor: "#0a0a0f",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "..", "public", "icons", process.platform === "win32" ? "icon.ico" : "icon.png"),
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));

  splashWindow.once("ready-to-show", () => {
    splashWindow.show();
  });
}

function sendSplashStatus(msg) {
  splashWindow?.webContents.send("splash-status", msg);
}

function sendSplashProgress(pct) {
  splashWindow?.webContents.send("splash-progress", pct);
}

function sendSplashError(title, desc) {
  splashWindow?.webContents.send("splash-error", title, desc);
}

function sendSplashDone() {
  splashWindow?.webContents.send("splash-done");
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

// ─── Main Window ───

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#09090b",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "..", "public", "icons", process.platform === "win32" ? "icon.ico" : "icon.png"),
  });

  const url = isDev ? `http://localhost:${PORT}/login` : `${PRODUCTION_URL}/login`;
  mainWindow.loadURL(url);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    closeSplash();
  });

  mainWindow.on("maximize", () => mainWindow?.webContents.send("window-maximize-change", true));
  mainWindow.on("unmaximize", () => mainWindow?.webContents.send("window-maximize-change", false));

  mainWindow.on("close", (e) => {
    if (!isQuitting) { e.preventDefault(); mainWindow.hide(); return false; }
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ─── Tray ───

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: "AURUM VPN", enabled: false },
    { type: "separator" },
    { label: "Show Dashboard", click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
    { type: "separator" },
    { label: "Connect VPN", click: () => { if (mainWindow) { mainWindow.show(); mainWindow.webContents.send("vpn-connect"); } } },
    { label: "Disconnect VPN", click: () => { if (mainWindow) { mainWindow.show(); mainWindow.webContents.send("vpn-disconnect"); } } },
    { type: "separator" },
    { label: "Quit", click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setToolTip("AURUM VPN");
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } });
}

// ─── IPC Handlers ─── Window Controls ───

ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("window-close", () => mainWindow?.close());
ipcMain.handle("window-is-maximized", () => mainWindow?.isMaximized() ?? false);

// ─── Splash IPC ───

ipcMain.on("splash-retry", () => { runStartupSequence(); });
ipcMain.on("splash-continue", () => {
  sendSplashDone();
  createMainWindow();
  if (tray) createTray();
});

// ─── Updater ───

const UA = "AURUM-VPN/1.0";

function isNewerVersion(latest, current) {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

function httpsGet(urlStr) {
  return new Promise((resolve, reject) => {
    function doRequest(url) {
      const parsed = new URL(url);
      const opts = { hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers: { "User-Agent": UA } };
      https.get(opts, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doRequest(new URL(res.headers.location, url).href);
          return;
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}`));
          else resolve(data);
        });
      }).on("error", reject);
    }
    doRequest(urlStr);
  });
}

function downloadFile(urlStr, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    function doDownload(url) {
      const parsed = new URL(url);
      const opts = { hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers: { "User-Agent": UA } };
      https.get(opts, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doDownload(new URL(res.headers.location, url).href);
          return;
        }
        if (res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
        const total = parseInt(res.headers["content-length"] || "0", 10);
        let transferred = 0;
        const file = fs.createWriteStream(destPath);
        res.on("data", (chunk) => { transferred += chunk.length; if (onProgress && total) onProgress(transferred, total); });
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
        file.on("error", reject);
      }).on("error", reject);
    }
    doDownload(urlStr);
  });
}

async function checkForUpdate() {
  sendSplashStatus("Checking for updates...");
  const response = await httpsGet(UPDATE_API_URL);
  const data = JSON.parse(response);
  if (!data.version) return null;
  const current = app.getVersion();
  if (!isNewerVersion(data.version, current)) return null;
  return data;
}

async function runStartupSequence() {
  try {
    sendSplashStatus("Checking for updates...");
    const updateData = await checkForUpdate();

    if (updateData) {
      sendSplashStatus(`Update available: v${updateData.version}`);
      const fileInfo = updateData.files[0];
      const cacheDir = path.join(app.getPath("userData"), "update-cache");
      fs.mkdirSync(cacheDir, { recursive: true });
      updateFilePath = path.join(cacheDir, fileInfo.url.split("/").pop());

      let lastPct = -1;
      await downloadFile(fileInfo.url, updateFilePath, (transferred, total) => {
        const pct = Math.round((transferred / total) * 100);
        if (pct !== lastPct) { lastPct = pct; sendSplashProgress(pct); }
      });

      sendSplashStatus("Update ready. Launching...");
      await new Promise((r) => setTimeout(r, 500));
    } else {
      sendSplashStatus("You're up to date!");
      await new Promise((r) => setTimeout(r, 800));
    }

    sendSplashDone();
    createMainWindow();
    if (tray) createTray();
  } catch (err) {
    console.error("[startup] Error:", err.message);
    if (err.message.includes("ENOTFOUND") || err.message.includes("EAI_AGAIN") || err.message.includes("getaddrinfo")) {
      sendSplashError("Can't connect to network", "Check your internet connection and try again.");
    } else {
      sendSplashError("Update check failed", err.message);
    }
  }
}

// ─── Manual Updater IPC (from renderer) ───

ipcMain.on("updater:check", () => customCheckForUpdates());
ipcMain.on("updater:download", () => customDownloadUpdate());
ipcMain.on("updater:install", () => customInstallUpdate());

ipcMain.on("renderer:ready", () => {
  customCheckForUpdates();
});

async function customCheckForUpdates() {
  try {
    const data = await checkForUpdate();
    if (data) {
      mainWindow?.webContents.send("updater:update-available", { version: data.version });
    }
  } catch (err) {
    mainWindow?.webContents.send("updater:error", err.message);
  }
}

async function customDownloadUpdate() {
  try {
    const data = await checkForUpdate();
    if (!data || !data.files || !data.files[0]) throw new Error("No update available");
    const fileInfo = data.files[0];
    const cacheDir = path.join(app.getPath("userData"), "update-cache");
    fs.mkdirSync(cacheDir, { recursive: true });
    updateFilePath = path.join(cacheDir, fileInfo.url.split("/").pop());
    mainWindow?.webContents.send("updater:download-progress", { percent: 0, transferred: 0, total: fileInfo.size || 0 });
    let lastPct = -1;
    await downloadFile(fileInfo.url, updateFilePath, (transferred, total) => {
      const pct = Math.round((transferred / total) * 100);
      if (pct !== lastPct) { lastPct = pct; mainWindow?.webContents.send("updater:download-progress", { percent: pct, transferred, total }); }
    });
    mainWindow?.webContents.send("updater:update-downloaded", { version: data.version });
  } catch (err) {
    mainWindow?.webContents.send("updater:error", err.message);
  }
}

function customInstallUpdate() {
  if (!updateFilePath) { mainWindow?.webContents.send("updater:error", "No update downloaded"); return; }
  spawn(updateFilePath, ["--updated"], { detached: true, stdio: "ignore" }).unref();
  app.quit();
}

// ─── WireGuard IPC Handlers ───

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: "utf-8", timeout: 15000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
}

function isWindows() { return process.platform === "win32"; }

ipcMain.handle("wg:installCheck", async () => {
  try {
    if (isWindows()) {
      const out = await runCommand("where wg 2>nul || echo notfound");
      return { installed: out.trim() !== "notfound", platform: "win32" };
    }
    const out = await runCommand("which wg 2>/dev/null || echo notfound");
    return { installed: out.trim() !== "notfound", platform: process.platform };
  } catch { return { installed: false, platform: process.platform }; }
});

ipcMain.handle("wg:genkey", async () => {
  try { const key = await runCommand("wg genkey"); return { success: true, key: key.trim() }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle("wg:pubkey", async (_, pk) => {
  try { const key = await runCommand(`echo ${pk.trim()} | wg pubkey`); return { success: true, key: key.trim() }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle("wg:genpsk", async () => {
  try { const key = await runCommand("wg genpsk"); return { success: true, key: key.trim() }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle("wg:show", async (_, iface) => {
  try { const out = await runCommand(`wg show ${iface}`); return { success: true, output: out }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle("wg:addPeer", async (_, iface, pk, ips) => {
  try { await runCommand(`wg set ${iface} peer ${pk} allowed-ips ${ips}`); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle("wg:removePeer", async (_, iface, pk) => {
  try { await runCommand(`wg set ${iface} peer ${pk} remove`); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle("wg:status", async (_, iface) => {
  try {
    const raw = await runCommand(`wg show ${iface}`);
    const lines = raw.split("\n");
    const peerCount = lines.filter((l) => l.trim().startsWith("peer:")).length;
    return { success: true, status: { interfaceName: iface, listening: raw.includes("listening port"), peerCount, raw } };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle("platform", () => process.platform);
ipcMain.handle("hostname", () => require("os").hostname());

// ─── App Lifecycle ───

app.whenReady().then(() => {
  createSplashWindow();
  setTimeout(runStartupSequence, 400);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && !isQuitting) app.quit();
});

app.on("activate", () => {
  if (mainWindow) { mainWindow.show(); } else { createMainWindow(); }
});

app.on("before-quit", () => { isQuitting = true; });
