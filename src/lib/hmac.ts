import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SECRET = process.env.SESSION_SECRET!;

export function signToken(payload: string): string {
  const nonce = randomBytes(16).toString("hex");
  const data = `${payload}.${nonce}`;
  const sig = createHmac("sha256", SECRET).update(data).digest("hex");
  return Buffer.from(`${data}.${sig}`).toString("base64url");
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    const data = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const expected = createHmac("sha256", SECRET).update(data).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    return data.split(".")[0];
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return createHmac("sha256", SECRET).update(token).digest("hex");
}
