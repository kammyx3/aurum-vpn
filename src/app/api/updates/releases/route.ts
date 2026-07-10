import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let userId: string;
  try {
    const data = JSON.parse(atob(session.value));
    userId = data.userId;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
    return NextResponse.json({
      id: release.id,
      version: release.version,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create release" },
      { status: 500 }
    );
  }
}
