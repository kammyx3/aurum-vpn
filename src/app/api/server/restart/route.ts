import { NextResponse } from "next/server";
import { restartVpn } from "@/lib/wireguard/service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await restartVpn();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to restart VPN" },
      { status: 500 }
    );
  }
}
