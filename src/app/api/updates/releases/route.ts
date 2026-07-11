import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { supabaseUserId: session.user.id },
    });
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { version, fileUrl, fileSha512, fileSize, portableUrl, notes } = body;
    if (!version || !fileUrl || !fileSha512) {
      return NextResponse.json(
        { error: "Missing required fields: version, fileUrl, fileSha512" },
        { status: 400 }
      );
    }

    const release = await prisma.updateRelease.create({
      data: {
        version,
        fileUrl,
        fileSha512,
        fileSize: BigInt(fileSize || 0),
        portableUrl: portableUrl || null,
        notes: notes || "",
        releaseDate: new Date(),
      },
    });

    return NextResponse.json({ id: release.id, version: release.version });
  } catch {
    return NextResponse.json({ error: "Failed to create release" }, { status: 500 });
  }
}
