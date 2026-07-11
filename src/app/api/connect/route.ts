import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getUserEntitlements } from "@/lib/access";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { supabaseUserId: session.user.id },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { nodeId, deviceId } = await request.json();
    if (!nodeId) {
      return NextResponse.json({ error: "Node ID required" }, { status: 400 });
    }

    const node = await prisma.vpnNode.findUnique({ where: { id: nodeId } });
    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    const entitlements = await getUserEntitlements(profile.id);
    if (!entitlements.plan) {
      return NextResponse.json({ error: "No active plan" }, { status: 403 });
    }

    if (node.requiredPlanSlug && entitlements.plan.slug !== node.requiredPlanSlug) {
      return NextResponse.json({
        error: `Requires ${node.requiredPlanSlug} plan`,
        requiredPlan: node.requiredPlanSlug,
      }, { status: 403 });
    }

    const device = deviceId
      ? await prisma.userDevice.findFirst({ where: { id: deviceId, userId: profile.id } })
      : null;

    if (!device) {
      return NextResponse.json({ error: "Select or create a device first" }, { status: 400 });
    }

    // TODO: Replace with real WireGuard config generation when native app is ready
    const configContent = `[Interface]
PrivateKey = <generated-server-side>
Address = 10.8.0.${Math.floor(Math.random() * 250) + 2}/32
DNS = 1.1.1.1

[Peer]
PublicKey = ${node.publicKey || "<node-public-key>"}
Endpoint = ${node.endpointHost}:${node.endpointPort}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25`;

    const session_ = await prisma.vpnSession.create({
      data: {
        userId: profile.id,
        deviceId: device.id,
        nodeId: node.id,
        status: "connecting",
        connectedAt: new Date(),
      },
    });

    return NextResponse.json({
      session: session_.id,
      config: configContent,
      node: {
        name: node.name,
        city: node.city,
        country: node.country,
        endpointHost: node.endpointHost,
      },
      // TODO: Real WireGuard integration — this is a placeholder config
      _placeholder: true,
    });
  } catch {
    return NextResponse.json({ error: "Connection failed" }, { status: 500 });
  }
}
