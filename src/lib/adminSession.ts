import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "sakura_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function getSecret() {
  return process.env.ADMIN_PASSWORD_HASH || process.env.HMAC_SECRET || "admin-session-dev-secret";
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(now = Date.now()) {
  const payload = base64url(JSON.stringify({ exp: now + SESSION_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string | undefined | null, now = Date.now()) {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof parsed.exp === "number" && parsed.exp > now;
  } catch {
    return false;
  }
}
