import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDevices, createDevice } from "@/lib/wireguard/service";

export const dynamic = "force-dynamic";

const createDeviceSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(["windows", "macos", "linux", "ios", "android", "unknown"]),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const devices = await getDevices();
    return NextResponse.json(devices);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createDeviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const device = await createDevice(parsed.data);
    return NextResponse.json({
      ...device,
      uploadBytes: Number(device.uploadBytes),
      downloadBytes: Number(device.downloadBytes),
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create device" },
      { status: 500 }
    );
  }
}
