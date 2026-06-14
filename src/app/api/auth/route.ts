import { createHash } from "crypto";
import { NextResponse } from "next/server";

const AUTH_COOKIE = "meridian-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  const configured = process.env.VIEWER_PASSWORD;
  if (!configured) {
    return NextResponse.json({ error: "Auth not configured on server" }, { status: 503 });
  }

  if (!password || password !== configured) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Cookie value = sha256(password) — matches what middleware derives
  const hash = createHash("sha256").update(configured).digest("hex");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
