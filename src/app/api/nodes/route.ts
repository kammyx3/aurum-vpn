import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const nodes = await prisma.vpnNode.findMany({
      where: { active: true },
      orderBy: [{ country: "asc" }, { city: "asc" }],
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        countryCode: true,
        region: true,
        latitude: true,
        longitude: true,
        status: true,
        loadPercent: true,
        latencyMs: true,
        tier: true,
        requiredPlanSlug: true,
        requiredPerkSlugs: true,
        tags: true,
        protocols: true,
        currentUsers: true,
        maxUsers: true,
      },
    });

    return NextResponse.json({ nodes });
  } catch {
    return NextResponse.json({ error: "Failed to fetch nodes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseUserId } = body;

    if (!supabaseUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({ where: { supabaseUserId } });
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const node = await prisma.vpnNode.create({ data: body.data });
    return NextResponse.json({ node });
  } catch {
    return NextResponse.json({ error: "Failed to create node" }, { status: 500 });
  }
}
