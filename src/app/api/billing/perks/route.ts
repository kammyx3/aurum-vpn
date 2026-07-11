import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const perks = await prisma.perk.findMany({
      where: { active: true },
      orderBy: { priceMonthly: "asc" },
    });
    return NextResponse.json({ perks });
  } catch {
    return NextResponse.json({ error: "Failed to fetch perks" }, { status: 500 });
  }
}
