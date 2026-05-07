import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminSession";

export function unauthorizedAdminResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export async function isAdminRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.split("=")[1];

  if (verifyAdminSessionToken(sessionCookie)) return true;

  const authHeader = req.headers.get("authorization") ?? "";
  const [scheme, base64] = authHeader.split(" ");
  if (scheme !== "Basic" || !base64) return false;

  const decoded = Buffer.from(base64, "base64").toString("utf8");
  const [, password] = decoded.split(":");
  const adminHash = process.env.ADMIN_PASSWORD_HASH ?? "";

  return Boolean(password && adminHash && await bcrypt.compare(password, adminHash));
}
