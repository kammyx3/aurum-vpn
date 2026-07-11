const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
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

// ─── Splash Screen ───

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 460,
    frame: false,
    resizable: false,
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

function splashSend(channel, ...args) {
  splashWindow?.webContents.send(channel, ...args);
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

// ─── IPC Handlers ───

ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("window-close", () => mainWindow?.close());
ipcMain.handle("window-is-maximized", () => mainWindow?.isMaximized() ?? false);

// ─── Updater ───

const UA = "AURUM-VPN/1.0";

function httpsGet(urlStr) {
  return new Promise((resolve, reject) => {
    function req(url) {
      const parsed = new URL(url);
      https.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers: { "User-Agent": UA } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          req(new URL(res.headers.location, url).href);
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
    req(urlStr);
  });
}

function downloadFile(urlStr, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    function dl(url) {
      const parsed = new URL(url);
      https.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers: { "User-Agent": UA } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          dl(new URL(res.headers.location, url).href);
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
    dl(urlStr);
  });
}

function isNewerVersion(latest, current) {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

const VERSION_FILE = path.join(app.getPath("userData"), "updated-version");

async function runStartupSequence() {
  // If we just updated, record so we don't re-download it
  const currentVersion = app.getVersion();
  const previouslyUpdated = getUpdatedVersion();

  try {
    splashSend("splash-status", "Checking for updates...");

    const response = await httpsGet(UPDATE_API_URL);
    const data = JSON.parse(response);

    if (data && data.version && isNewerVersion(data.version, currentVersion) && data.version !== previouslyUpdated) {
      splashSend("splash-status", `Downloading update v${data.version}...`);

      const fileInfo = data.files[0];
      const cacheDir = path.join(app.getPath("userData"), "update-cache");
      fs.mkdirSync(cacheDir, { recursive: true });
      const installerPath = path.join(cacheDir, fileInfo.url.split("/").pop());

      let lastPct = -1;
      await downloadFile(fileInfo.url, installerPath, (transferred, total) => {
        const pct = Math.round((transferred / total) * 100);
        if (pct !== lastPct) { lastPct = pct; splashSend("splash-progress", pct); }
      });

      // Mark this version as updated so we don't re-download on the new install
      saveUpdatedVersion(data.version);

      splashSend("splash-status", "Installing update...");
      await new Promise((r) => setTimeout(r, 800));

      // Spawn installer silently and quit
      spawn(installerPath, ["--updated"], { detached: true, stdio: "ignore" }).unref();
      isQuitting = true;
      app.quit();
      return;
    }

    // No update or same version
    splashSend("splash-status", "You're up to date!");
    await new Promise((r) => setTimeout(r, 800));
    splashSend("splash-done");
    createMainWindow();
    if (tray) createTray();

  } catch (err) {
    console.error("[updater]", err.message);
    const isNetwork = err.message.includes("ENOTFOUND") || err.message.includes("EAI_AGAIN") || err.message.includes("getaddrinfo");
    splashSend("splash-status", isNetwork ? "No network connection" : "Update check failed");
    splashSend("splash-progress", 100);
    await new Promise((r) => setTimeout(r, 1500));
    splashSend("splash-done");
    createMainWindow();
    if (tray) createTray();
  }
}

function saveUpdatedVersion(version) {
  try { fs.writeFileSync(VERSION_FILE, version, "utf-8"); } catch {}
}

function getUpdatedVersion() {
  try { return fs.readFileSync(VERSION_FILE, "utf-8").trim(); } catch { return ""; }
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
