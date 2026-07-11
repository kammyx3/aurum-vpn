import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const caller = await prisma.userProfile.findUnique({ where: { supabaseUserId: session.user.id } });
    if (!caller || caller.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await prisma.userProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: { currentPlan: true, devices: true },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
