import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "news_admin_session";

function signature(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
}

export async function createAdminSession() {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const value = String(expiresAt);
  const token = `${value}.${signature(value)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [expires, provided] = token.split(".");
  const expected = signature(expires);
  if (!expires || !provided || !expected || Date.now() > Number(expires)) return false;
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
