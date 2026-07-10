import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function truncateKey(key: string, chars = 8): string {
  if (!key) return "";
  if (key.length <= chars * 2) return key;
  return `${key.slice(0, chars)}...${key.slice(-chars)}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
    case "online":
    case "available":
      return "text-emerald-500";
    case "inactive":
    case "offline":
      return "text-zinc-400";
    case "disabled":
      return "text-amber-500";
    case "error":
    case "coming-soon":
      return "text-red-500";
    default:
      return "text-zinc-400";
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case "active":
    case "online":
    case "available":
      return "bg-emerald-500/10 text-emerald-500";
    case "inactive":
    case "offline":
      return "bg-zinc-500/10 text-zinc-400";
    case "disabled":
      return "bg-amber-500/10 text-amber-500";
    case "error":
    case "coming-soon":
      return "bg-red-500/10 text-red-500";
    default:
      return "bg-zinc-500/10 text-zinc-400";
  }
}
