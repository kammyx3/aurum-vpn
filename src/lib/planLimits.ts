import type { PlanType } from "@/types";

export interface PlanLimits {
  maxDevices: number;
  maxRegions: number;
  advancedStats: boolean;
  customDns: boolean;
  keyRotationReminders: boolean;
  brandedConfigs: boolean;
  deviceNotes: boolean;
  advancedAuditLog: boolean;
  teamDevices: boolean;
  csvExport: boolean;
  activityHistoryDays: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxDevices: 2,
    maxRegions: 1,
    advancedStats: false,
    customDns: false,
    keyRotationReminders: false,
    brandedConfigs: false,
    deviceNotes: false,
    advancedAuditLog: false,
    teamDevices: false,
    csvExport: false,
    activityHistoryDays: 7,
  },
  premium: {
    maxDevices: Infinity,
    maxRegions: Infinity,
    advancedStats: true,
    customDns: true,
    keyRotationReminders: true,
    brandedConfigs: true,
    deviceNotes: true,
    advancedAuditLog: true,
    teamDevices: true,
    csvExport: true,
    activityHistoryDays: 365,
  },
};

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canAddDevice(plan: PlanType, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxDevices;
}

export function isPremiumFeature(plan: PlanType, feature: keyof PlanLimits): boolean {
  if (plan === "premium") return true;
  const val = PLAN_LIMITS[plan][feature];
  return typeof val === "boolean" ? val : false;
}

export const PREMIUM_FEATURES = [
  { key: "maxDevices" as const, label: "Unlimited Devices", description: "Connect all your devices without limits" },
  { key: "advancedStats" as const, label: "Advanced Analytics", description: "Detailed traffic analysis and usage trends" },
  { key: "customDns" as const, label: "Custom DNS", description: "Use your preferred DNS resolvers" },
  { key: "maxRegions" as const, label: "Multi-Region", description: "Connect to servers worldwide" },
  { key: "keyRotationReminders" as const, label: "Key Rotation", description: "Automatic security key rotation reminders" },
  { key: "brandedConfigs" as const, label: "Branded Configs", description: "Custom client configuration files" },
  { key: "deviceNotes" as const, label: "Device Notes", description: "Add notes and labels to your devices" },
  { key: "advancedAuditLog" as const, label: "Audit Log", description: "Comprehensive security audit trail" },
  { key: "teamDevices" as const, label: "Team Devices", description: "Manage devices for your team" },
  { key: "csvExport" as const, label: "CSV Export", description: "Export your data to CSV files" },
];

export const PREMIUM_PRICE = 9.99;
export const PREMIUM_PRICE_ANNUAL = 99.99;
