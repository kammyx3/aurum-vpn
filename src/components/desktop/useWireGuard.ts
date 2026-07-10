"use client";

import { useState, useEffect, useCallback } from "react";

interface WgStatus {
  installed: boolean;
  platform: string;
  running: boolean;
  interfaceName: string;
  peerCount: number;
}

export function useWireGuard() {
  const [status, setStatus] = useState<WgStatus>({
    installed: false,
    platform: "unknown",
    running: false,
    interfaceName: "wg0",
    peerCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  const checkStatus = useCallback(async (interfaceName = "wg0") => {
    if (!isElectron) {
      setStatus({ installed: false, platform: "web", running: false, interfaceName, peerCount: 0 });
      setLoading(false);
      return;
    }

    try {
      const installCheck = await window.electronAPI!.wg.installCheck();
      if (!installCheck.installed) {
        setStatus({ installed: false, platform: installCheck.platform, running: false, interfaceName, peerCount: 0 });
        setLoading(false);
        return;
      }

      const wgStatus = await window.electronAPI!.wg.status(interfaceName);
      setStatus({
        installed: true,
        platform: installCheck.platform,
        running: wgStatus.success && wgStatus.status?.listening ? true : false,
        interfaceName: wgStatus.status?.interfaceName || interfaceName,
        peerCount: wgStatus.status?.peerCount || 0,
      });
    } catch {
      setStatus((prev) => ({ ...prev, installed: false }));
    } finally {
      setLoading(false);
    }
  }, [isElectron]);

  const generateKey = useCallback(async () => {
    if (!isElectron) return null;
    const result = await window.electronAPI!.wg.genkey();
    return result.success ? result.key! : null;
  }, [isElectron]);

  const getPublicKey = useCallback(async (privateKey: string) => {
    if (!isElectron) return null;
    const result = await window.electronAPI!.wg.pubkey(privateKey);
    return result.success ? result.key! : null;
  }, [isElectron]);

  const generatePresharedKey = useCallback(async () => {
    if (!isElectron) return null;
    const result = await window.electronAPI!.wg.genpsk();
    return result.success ? result.key! : null;
  }, [isElectron]);

  const addPeer = useCallback(async (publicKey: string, allowedIPs: string, interfaceName = "wg0") => {
    if (!isElectron) return false;
    const result = await window.electronAPI!.wg.addPeer(interfaceName, publicKey, allowedIPs);
    return result.success;
  }, [isElectron]);

  const removePeer = useCallback(async (publicKey: string, interfaceName = "wg0") => {
    if (!isElectron) return false;
    const result = await window.electronAPI!.wg.removePeer(interfaceName, publicKey);
    return result.success;
  }, [isElectron]);

  const bringUp = useCallback(async (interfaceName = "wg0") => {
    if (!isElectron) return false;
    const result = await window.electronAPI!.wg.bringUp(interfaceName);
    if (result.success) checkStatus(interfaceName);
    return result.success;
  }, [isElectron, checkStatus]);

  const bringDown = useCallback(async (interfaceName = "wg0") => {
    if (!isElectron) return false;
    const result = await window.electronAPI!.wg.bringDown(interfaceName);
    if (result.success) checkStatus(interfaceName);
    return result.success;
  }, [isElectron, checkStatus]);

  const getWgShow = useCallback(async (interfaceName = "wg0") => {
    if (!isElectron) return null;
    const result = await window.electronAPI!.wg.show(interfaceName);
    return result.success ? result.output! : null;
  }, [isElectron]);

  const writeConfig = useCallback(async (interfaceName: string, content: string) => {
    if (!isElectron) return false;
    const result = await window.electronAPI!.wg.writeConfig(interfaceName, content);
    return result.success;
  }, [isElectron]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!isElectron) {
        setStatus({ installed: false, platform: "web", running: false, interfaceName: "wg0", peerCount: 0 });
        setLoading(false);
        return;
      }
      try {
        const installCheck = await window.electronAPI!.wg.installCheck();
        if (cancelled) return;
        if (!installCheck.installed) {
          setStatus({ installed: false, platform: installCheck.platform, running: false, interfaceName: "wg0", peerCount: 0 });
          setLoading(false);
          return;
        }
        const wgStatus = await window.electronAPI!.wg.status("wg0");
        if (cancelled) return;
        setStatus({
          installed: true,
          platform: installCheck.platform,
          running: wgStatus.success && wgStatus.status?.listening ? true : false,
          interfaceName: wgStatus.status?.interfaceName || "wg0",
          peerCount: wgStatus.status?.peerCount || 0,
        });
      } catch {
        if (!cancelled) setStatus((prev) => ({ ...prev, installed: false }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [isElectron]);

  return {
    status,
    loading,
    isElectron,
    checkStatus,
    generateKey,
    getPublicKey,
    generatePresharedKey,
    addPeer,
    removePeer,
    bringUp,
    bringDown,
    getWgShow,
    writeConfig,
  };
}
