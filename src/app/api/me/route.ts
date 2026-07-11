import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { supabaseUserId: session.user.id },
      include: {
        currentPlan: true,
        perks: { where: { active: true }, include: { perk: true } },
        devices: { where: { enabled: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const billingEvents = await prisma.billingEvent.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role,
        currentPlan: profile.currentPlan,
        perks: profile.perks,
        devices: profile.devices,
      },
      billingEvents,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
