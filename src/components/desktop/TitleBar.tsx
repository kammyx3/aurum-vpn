"use client";

import { useState, useEffect } from "react";
import { Minus, Square, X, Shield, Download, Loader2, Check, RefreshCw } from "lucide-react";

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "downloaded" | "error";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<{ version?: string; releaseDate?: string }>({});
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    setIsElectron(true); // eslint-disable-line react-hooks/set-state-in-effect -- syncing with external Electron API

    api.rendererReady?.();

    api.isMaximized().then(setIsMaximized);

    api.onMaximizeChange?.(setIsMaximized);

    api.updater?.onUpdateAvailable?.((_event: unknown, info: { version: string; releaseDate: string }) => {
      setUpdateStatus("available");
      setUpdateInfo(info);
      setShowUpdatePanel(true);
    });

    api.updater?.onDownloadProgress?.((_event: unknown, progress: { percent: number }) => {
      setUpdateStatus("downloading");
      setDownloadProgress(Math.round(progress.percent));
    });

    api.updater?.onUpdateDownloaded?.((_event: unknown, info: { version: string }) => {
      setUpdateStatus("downloaded");
      setUpdateInfo((prev) => ({ ...prev, version: info.version }));
    });

    api.updater?.onUpdateError?.((_event: unknown, message: string) => {
      setUpdateStatus("error");
      setErrorMessage(message || "Unknown error");
    });
  }, []);

  const handleCheckUpdate = () => {
    setUpdateStatus("checking");
    window.electronAPI?.updater?.checkForUpdates?.();
  };

  const handleDownloadUpdate = () => {
    setUpdateStatus("downloading");
    window.electronAPI?.updater?.downloadUpdate?.();
  };

  const handleInstallUpdate = () => {
    window.electronAPI?.updater?.installUpdate?.();
  };

  if (!isElectron) return null;

  return (
    <>
      <div
        className="h-9 flex items-center justify-between bg-[#0a0a0c] border-b border-zinc-800 select-none"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 pl-3">
          <Shield className="h-3.5 w-3.5 text-[#c8a54e]" />
          <span className="text-xs font-semibold tracking-wider">
            <span className="text-[#c8a54e]">AURUM</span>
            <span className="text-zinc-500 ml-1">VPN</span>
          </span>
        </div>

        <div className="flex items-center h-full gap-1">
          {(updateStatus === "downloaded" || showUpdatePanel) && (
            <div
              className="flex items-center h-full px-2"
              style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => setShowUpdatePanel(!showUpdatePanel)}
                className="relative flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium transition-colors bg-[#c8a54e]/10 text-[#c8a54e] hover:bg-[#c8a54e]/20"
              >
                {updateStatus === "downloaded" ? (
                  <RefreshCw className="h-3 w-3" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                <span>{updateStatus === "downloaded" ? "Update Ready" : "Update"}</span>
              </button>
            </div>
          )}

          <div
            className="flex items-center h-full"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={() => window.electronAPI!.minimize()}
              className="h-full px-3 hover:bg-zinc-800 transition-colors flex items-center justify-center"
              title="Minimize"
            >
              <Minus className="h-3.5 w-3.5 text-zinc-400" />
            </button>
            <button
              type="button"
              onClick={() => window.electronAPI!.maximize()}
              className="h-full px-3 hover:bg-zinc-800 transition-colors flex items-center justify-center"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Square className="h-3 w-3 text-zinc-400" />
              ) : (
                <Square className="h-3.5 w-3.5 text-zinc-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => window.electronAPI!.close()}
              className="h-full px-3 hover:bg-red-600 transition-colors flex items-center justify-center"
              title="Close"
            >
              <X className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {showUpdatePanel && (
        <UpdatePanel
          status={updateStatus}
          updateInfo={updateInfo}
          downloadProgress={downloadProgress}
          errorMessage={errorMessage}
          onCheck={handleCheckUpdate}
          onDownload={handleDownloadUpdate}
          onInstall={handleInstallUpdate}
          onClose={() => setShowUpdatePanel(false)}
        />
      )}
    </>
  );
}

function UpdatePanel({
  status,
  updateInfo,
  downloadProgress,
  errorMessage,
  onCheck,
  onDownload,
  onInstall,
  onClose,
}: {
  status: UpdateStatus;
  updateInfo: { version?: string; releaseDate?: string };
  downloadProgress: number;
  errorMessage: string;
  onCheck: () => void;
  onDownload: () => void;
  onInstall: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-9 right-12 z-50 w-80 bg-[#111113] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold">Updates</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {status === "idle" && (
          <div className="text-center space-y-3">
            <p className="text-xs text-zinc-400">You are running the latest version.</p>
            <button
              type="button"
              onClick={onCheck}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Check for Updates
            </button>
          </div>
        )}

        {status === "checking" && (
          <div className="text-center space-y-2 py-2">
            <Loader2 className="h-5 w-5 text-[#c8a54e] animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Checking for updates...</p>
          </div>
        )}

        {status === "available" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2 rounded-md bg-[#c8a54e]/5 border border-[#c8a54e]/20">
              <Download className="h-4 w-4 text-[#c8a54e] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-[#c8a54e]">Update Available</p>
                {updateInfo.version && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">Version {updateInfo.version}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onDownload}
              className="w-full px-3 py-2 rounded-md bg-[#c8a54e] hover:bg-[#b8963e] text-black text-xs font-semibold transition-colors"
            >
              Download &amp; Install
            </button>
          </div>
        )}

        {status === "downloading" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">Downloading update...</p>
                <span className="text-[11px] text-zinc-500">{downloadProgress}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c8a54e] rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {status === "downloaded" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2 rounded-md bg-emerald-500/5 border border-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-500">Update Ready</p>
                {updateInfo.version && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Version {updateInfo.version} has been downloaded.
                  </p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 text-center">
              The app will restart to apply the update.
            </p>
            <button
              type="button"
              onClick={onInstall}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[#c8a54e] hover:bg-[#b8963e] text-black text-xs font-semibold transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Restart &amp; Update
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-3">
            <p className="text-xs text-red-400">Update check failed</p>
            <p className="text-[10px] text-zinc-500 break-all">{errorMessage}</p>
            <button
              type="button"
              onClick={onCheck}
              className="w-full px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
