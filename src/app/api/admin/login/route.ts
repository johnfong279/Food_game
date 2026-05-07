import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from "@/lib/adminSession";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/admin");
  const next = requestedNext.startsWith("/admin") && !requestedNext.startsWith("/admin/login")
    ? requestedNext
    : "/admin";

  const adminHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const valid = Boolean(password && adminHash && await bcrypt.compare(password, adminHash));

  if (!valid) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("error", "1");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
