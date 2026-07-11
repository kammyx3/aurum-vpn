import { prisma } from "@/lib/prisma";

export type UserEntitlements = {
  plan: {
    slug: string;
    name: string;
    maxDevices: number;
    allowedRegions: string[];
    allowedNodeTiers: string[];
    bandwidthLimitGb: number;
    features: Record<string, unknown>;
  } | null;
  perks: string[];
  deviceCount: number;
};

export async function getUserEntitlements(userId: string): Promise<UserEntitlements> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    include: {
      currentPlan: true,
      perks: { where: { active: true }, include: { perk: true } },
      devices: { where: { enabled: true } },
    },
  });

  if (!profile) {
    return { plan: null, perks: [], deviceCount: 0 };
  }

  return {
    plan: profile.currentPlan
      ? {
          slug: profile.currentPlan.slug,
          name: profile.currentPlan.name,
          maxDevices: profile.currentPlan.maxDevices,
          allowedRegions: JSON.parse(profile.currentPlan.allowedRegions),
          allowedNodeTiers: JSON.parse(profile.currentPlan.allowedNodeTiers),
          bandwidthLimitGb: profile.currentPlan.bandwidthLimitGb,
          features: JSON.parse(profile.currentPlan.features),
        }
      : null,
    perks: profile.perks.map((up) => up.perk.slug),
    deviceCount: profile.devices.length,
  };
}

export async function canAccessNode(userId: string, nodeId: string): Promise<{ allowed: boolean; reason?: string }> {
  const [node, entitlements] = await Promise.all([
    prisma.vpnNode.findUnique({ where: { id: nodeId } }),
    getUserEntitlements(userId),
  ]);

  if (!node) return { allowed: false, reason: "Node not found" };
  if (!node.active) return { allowed: false, reason: "Node is not active" };
  if (node.status === "offline" || node.status === "maintenance")
    return { allowed: false, reason: `Node is ${node.status}` };

  if (entitlements.plan) {
    if (
      node.requiredPlanSlug &&
      !entitlements.perks.includes(node.requiredPlanSlug) &&
      entitlements.plan.slug !== node.requiredPlanSlug
    ) {
      return { allowed: false, reason: `Requires ${node.requiredPlanSlug} plan` };
    }
    const allowedTiers = entitlements.plan.allowedNodeTiers;
    if (allowedTiers.length > 0 && !allowedTiers.includes(node.tier)) {
      return { allowed: false, reason: `Requires ${node.tier} tier access` };
    }
    if (entitlements.deviceCount >= entitlements.plan.maxDevices) {
      return { allowed: false, reason: "Device limit reached" };
    }
  } else {
    return { allowed: false, reason: "No active plan" };
  }

  if (node.requiredPerkSlugs.length > 2) {
    const requiredSlugs: string[] = JSON.parse(node.requiredPerkSlugs);
    for (const slug of requiredSlugs) {
      if (!entitlements.perks.includes(slug)) {
        return { allowed: false, reason: `Requires perk: ${slug}` };
      }
    }
  }

  return { allowed: true };
}

export async function canUsePerk(userId: string, perkSlug: string): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId);
  return entitlements.perks.includes(perkSlug);
}

export async function replaceUserPlan(userId: string, planSlug: string) {
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) throw new Error("Plan not found");
  await prisma.userProfile.update({
    where: { id: userId },
    data: { currentPlanId: plan.id },
  });
}

export async function requireAdmin(userId: string): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({ where: { id: userId } });
  return profile?.role === "admin";
}
