import { NextResponse } from "next/server";
import { getDevices, getServer } from "@/lib/wireguard/service";
import { buildClientConfig } from "@/lib/wireguard/parser";
import { generateClientConfig } from "@/lib/wireguard/clientConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const devices = await getDevices();
    const server = await getServer();

    const configs = devices.map((device) => {
      const wireguardConfig = buildClientConfig(device, server);
      return {
        id: device.id,
        name: device.name,
        config: generateClientConfig(wireguardConfig),
      };
    });

    return NextResponse.json(configs);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch configs" },
      { status: 500 }
    );
  }
}
