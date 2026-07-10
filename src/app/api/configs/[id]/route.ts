import { NextResponse, type NextRequest } from "next/server";
import { getServer } from "@/lib/wireguard/service";
import { getDevice } from "@/lib/storage";
import { buildClientConfig } from "@/lib/wireguard/parser";
import { generateClientConfig } from "@/lib/wireguard/clientConfig";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const device = await getDevice(id);

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    const server = await getServer();
    const wireguardConfig = buildClientConfig(device, server);
    const configText = generateClientConfig(wireguardConfig);

    return NextResponse.json({
      id: device.id,
      name: device.name,
      config: configText,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}
