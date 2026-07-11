import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient(request.headers);
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

    const { sessionId } = await request.json();
    if (sessionId) {
      await prisma.vpnSession.update({
        where: { id: sessionId },
        data: { status: "disconnected", disconnectedAt: new Date() },
      });
    } else {
      await prisma.vpnSession.updateMany({
        where: { userId: profile.id, status: { in: ["connecting", "connected"] } },
        data: { status: "disconnected", disconnectedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Disconnect failed" }, { status: 500 });
  }
}
