import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || typeof username !== "string" || username.length < 3) {
      return NextResponse.json(
        { success: false, error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { success: false, error: "Username must be alphanumeric" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, plan: "free" },
    });

    const cookieStore = await cookies();
    cookieStore.set("aurum-user-id", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 86400 * 7,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, plan: user.plan },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
