import { NextResponse, type NextRequest } from "next/server";
import { rotateDeviceKeys } from "@/lib/wireguard/service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const device = await rotateDeviceKeys(id);

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(device);
  } catch {
    return NextResponse.json(
      { error: "Failed to rotate device keys" },
      { status: 500 }
    );
  }
}
