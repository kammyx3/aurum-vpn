import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const release = await prisma.updateRelease.findFirst({
      orderBy: { releaseDate: "desc" },
    });
    if (!release) {
      return NextResponse.json(
        { error: "No releases found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      version: release.version,
      releaseDate: release.releaseDate.toISOString(),
      notes: release.notes,
      files: [
        {
          url: release.fileUrl,
          sha512: release.fileSha512,
          size: Number(release.fileSize),
        },
      ],
      portableUrl: release.portableUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch latest release" },
      { status: 500 }
    );
  }
}
