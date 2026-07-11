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

    const { planSlug } = await request.json();
    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    await prisma.userProfile.update({
      where: { supabaseUserId: session.user.id },
      data: { currentPlanId: plan.id },
    });

    return NextResponse.json({ success: true, plan: plan.slug });
  } catch {
    return NextResponse.json({ error: "Failed to assign plan" }, { status: 500 });
  }
}
