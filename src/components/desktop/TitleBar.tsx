"use client";

import { useState, useEffect } from "react";
import { Minus, Square, X, Shield } from "lucide-react";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    setIsElectron(true);

    api.isMaximized().then(setIsMaximized);
    api.onMaximizeChange?.(setIsMaximized);
  }, []);

  if (!isElectron) return null;

  return (
    <div
      className="h-9 flex items-center justify-between bg-sidebar border-b border-sidebar-border select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-3">
        <Shield className="h-3.5 w-3.5 text-[#c8a54e]" />
        <span className="text-xs font-semibold tracking-wider">
          <span className="text-[#c8a54e]">AURUM</span>
          <span className="text-sidebar-fg ml-1">VPN</span>
        </span>
      </div>

      <div className="flex items-center h-full">
        <div className="flex items-center h-full" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <button type="button" onClick={() => window.electronAPI!.minimize()} className="h-full px-3 hover:bg-muted transition-colors flex items-center justify-center" title="Minimize">
            <Minus className="h-3.5 w-3.5 text-sidebar-fg" />
          </button>
          <button type="button" onClick={() => window.electronAPI!.maximize()} className="h-full px-3 hover:bg-muted transition-colors flex items-center justify-center" title={isMaximized ? "Restore" : "Maximize"}>
            {isMaximized ? <Square className="h-3 w-3 text-sidebar-fg" /> : <Square className="h-3.5 w-3.5 text-sidebar-fg" />}
          </button>
          <button type="button" onClick={() => window.electronAPI!.close()} className="h-full px-3 hover:bg-red-600 transition-colors flex items-center justify-center" title="Close">
            <X className="h-3.5 w-3.5 text-sidebar-fg" />
          </button>
        </div>
      </div>
    </div>
  );
}
