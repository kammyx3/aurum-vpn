import { execSync } from "child_process";
import bcryptjs from "bcryptjs";

const SALT_ROUNDS = 12;

function isDemoMode(): boolean {
  return (process.env.VPN_MODE || "demo") === "demo";
}

function randomKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let key = "";
  for (let i = 0; i < 44; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key + "=";
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "aurum-admin-2024";
}

export function generateKeyPair(): {
  publicKey: string;
  privateKey: string;
} {
  if (isDemoMode()) {
    return { publicKey: randomKey(), privateKey: randomKey() };
  }
  try {
    const privateKey = execSync("wg genkey", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
    const publicKey = execSync(`echo "${privateKey}" | wg pubkey`, {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
    return { publicKey, privateKey };
  } catch {
    return { publicKey: randomKey(), privateKey: randomKey() };
  }
}

export function generatePresharedKey(): string {
  if (isDemoMode()) return randomKey();
  try {
    return execSync("wg genpsk", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
  } catch {
    return randomKey();
  }
}

export function checkKeyAge(
  lastRotation: string | null,
  daysThreshold = 90
): boolean {
  if (!lastRotation) return true;
  const lastDate = new Date(lastRotation);
  const now = new Date();
  const diffDays =
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > daysThreshold;
}

export function getSecurityScore(
  totalDevices: number,
  enabledDevices: number,
  devicesWithRecentHandshake: number,
  keyAgeOk: boolean
): number {
  let score = 100;
  const disabledRatio =
    totalDevices > 0 ? (totalDevices - enabledDevices) / totalDevices : 0;
  if (disabledRatio > 0.5) score -= 10;
  const activeRatio =
    totalDevices > 0 ? devicesWithRecentHandshake / totalDevices : 0;
  if (activeRatio < 0.3) score -= 5;
  if (!keyAgeOk) score -= 20;
  return Math.max(0, Math.min(100, score));
}
