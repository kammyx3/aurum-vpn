import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { supabaseUserId, email, displayName } = await request.json();
    if (!supabaseUserId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.userProfile.findUnique({ where: { supabaseUserId } });
    if (existing) {
      const updated = await prisma.userProfile.update({
        where: { id: existing.id },
        data: { email, displayName: displayName || existing.displayName },
      });
      return NextResponse.json({ profile: updated });
    }

    const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
    const profile = await prisma.userProfile.create({
      data: {
        supabaseUserId,
        email,
        displayName: displayName || email.split("@")[0],
        currentPlanId: freePlan?.id || null,
      },
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to sync profile" }, { status: 500 });
  }
}
