import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const caller = await prisma.userProfile.findUnique({ where: { supabaseUserId: session.user.id } });
    if (!caller || caller.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, ...data } = await request.json();
    const node = await prisma.vpnNode.update({ where: { id }, data });
    return NextResponse.json({ node });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const caller = await prisma.userProfile.findUnique({ where: { supabaseUserId: session.user.id } });
    if (!caller || caller.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await request.json();
    await prisma.vpnNode.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
