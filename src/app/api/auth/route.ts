import { createHash } from "crypto";
import { NextResponse } from "next/server";

const AUTH_COOKIE = "meridian-auth";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const expected = process.env.VIEWER_PASSWORD_HASH;
  if (!expected) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const hash = createHash("sha256").update(password).digest("hex");
  if (hash !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, hash, COOKIE_OPTS);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
