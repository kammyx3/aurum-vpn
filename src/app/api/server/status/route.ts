import { NextResponse } from "next/server";
import { getServerStatus } from "@/lib/wireguard/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getServerStatus();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch server status" },
      { status: 500 }
    );
  }
}
