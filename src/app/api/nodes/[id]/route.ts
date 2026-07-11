import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const node = await prisma.vpnNode.findUnique({ where: { id } });
    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }
    return NextResponse.json({ node });
  } catch {
    return NextResponse.json({ error: "Failed to fetch node" }, { status: 500 });
  }
}
