import { NextResponse } from "next/server";
import { getActivity } from "@/lib/wireguard/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activity = await getActivity();
    return NextResponse.json(activity);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch activity log" },
      { status: 500 }
    );
  }
}
