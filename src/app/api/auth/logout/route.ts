import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("aurum-user-id", "", { maxAge: 0, path: "/" });
  return NextResponse.json({ success: true });
}
