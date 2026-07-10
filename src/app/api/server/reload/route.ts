import { NextResponse } from "next/server";
import { reloadVpn } from "@/lib/wireguard/service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await reloadVpn();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to reload VPN config" },
      { status: 500 }
    );
  }
}
