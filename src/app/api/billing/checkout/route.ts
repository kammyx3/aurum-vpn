import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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

    const { planSlug } = await request.json();
    if (!planSlug) {
      return NextResponse.json({ error: "Plan slug required" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { currentPlanId: plan.id },
    });

    await prisma.billingEvent.create({
      data: {
        userId: profile.id,
        type: "plan_change",
        provider: "manual",
        metadata: JSON.stringify({ from: profile.currentPlanId, to: plan.id }),
      },
    });

    return NextResponse.json({ success: true, plan: plan.slug });
  } catch {
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
