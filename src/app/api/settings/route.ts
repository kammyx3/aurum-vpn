import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSettings, updateSettings } from "@/lib/storage";

export const dynamic = "force-dynamic";

const updateSettingsSchema = z.object({
  theme: z.string().optional(),
  plan: z.string().optional(),
});

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateSettings(parsed.data);
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
