import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUser } from "@/lib/storage";
import { verifyPassword } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await findUser(username);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

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
