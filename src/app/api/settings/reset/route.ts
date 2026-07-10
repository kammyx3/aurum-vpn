import { NextResponse } from "next/server";
import { resetStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await resetStore();
    return NextResponse.json({
      success: true,
      message: "All data has been reset",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset data" },
      { status: 500 }
    );
  }
}
