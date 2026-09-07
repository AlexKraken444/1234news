import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/database-url";

const scrypt = promisify(scryptCallback);
const USER_COOKIE = "news_user_session";
const SESSION_DAYS = 180;

export type PublicUser = { id: string; name: string };
export type NewsComment = { id: string; postId: string; author: string; text: string; createdAt: string };

function database() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("Vercel не передал строку подключения PostgreSQL");
  return neon(url);
}

async function ensureCommunityTables() {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS news_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_normalized TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS news_user_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES news_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS news_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES news_users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  return sql;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
}

async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function startSession(userId: string) {
  const sql = await ensureCommunityTables();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`INSERT INTO news_user_sessions (token_hash, user_id, expires_at) VALUES (${tokenHash(token)}, ${userId}, ${expiresAt.toISOString()})`;
  (await cookies()).set(USER_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt,
  });
}

export async function registerUser(name: string, password: string): Promise<PublicUser> {
  const cleanName = name.trim().replace(/\s+/g, " ");
  if (cleanName.length < 2 || cleanName.length > 30) throw new Error("Имя должно содержать от 2 до 30 символов");
  if (!/^[\p{L}\p{N}_ .-]+$/u.test(cleanName)) throw new Error("В имени есть недопустимые символы");
  if (password.length < 6 || password.length > 100) throw new Error("Пароль должен содержать от 6 до 100 символов");
  const sql = await ensureCommunityTables();
  const id = crypto.randomUUID();
  try {
    await sql`INSERT INTO news_users (id, name, name_normalized, password_hash) VALUES (${id}, ${cleanName}, ${normalizeName(cleanName)}, ${await hashPassword(password)})`;
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new Error("Такое имя уже занято");
    throw error;
  }
  await startSession(id);
  return { id, name: cleanName };
}

export async function loginUser(name: string, password: string): Promise<PublicUser> {
  const sql = await ensureCommunityTables();
  const rows = await sql`SELECT id, name, password_hash FROM news_users WHERE name_normalized = ${normalizeName(name)}`;
  if (!rows.length || !(await verifyPassword(password, String(rows[0].password_hash)))) throw new Error("Неверное имя или пароль");
  const user = { id: String(rows[0].id), name: String(rows[0].name) };
  await startSession(user.id);
  return user;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  try {
    const sql = await ensureCommunityTables();
    const rows = await sql`SELECT u.id, u.name FROM news_user_sessions s JOIN news_users u ON u.id = s.user_id
      WHERE s.token_hash = ${tokenHash(token)} AND s.expires_at > NOW()`;
    return rows.length ? { id: String(rows[0].id), name: String(rows[0].name) } : null;
  } catch (error) {
    console.error("Could not read user session", error);
    return null;
  }
}

export async function logoutUser() {
  const store = await cookies();
  const token = store.get(USER_COOKIE)?.value;
  if (token) {
    const sql = await ensureCommunityTables();
    await sql`DELETE FROM news_user_sessions WHERE token_hash = ${tokenHash(token)}`;
  }
  store.delete(USER_COOKIE);
}

export async function getComments(): Promise<NewsComment[]> {
  try {
    const sql = await ensureCommunityTables();
    const rows = await sql`SELECT c.id, c.post_id, c.text, c.created_at, u.name FROM news_comments c
      JOIN news_users u ON u.id = c.user_id ORDER BY c.created_at ASC`;
    return rows.map((row) => ({ id: String(row.id), postId: String(row.post_id), author: String(row.name), text: String(row.text), createdAt: new Date(String(row.created_at)).toISOString() }));
  } catch (error) {
    console.error("Could not load comments", error);
    return [];
  }
}

export async function createComment(postId: string, user: PublicUser, text: string): Promise<NewsComment> {
  const cleanText = text.trim();
  if (!postId || cleanText.length < 1 || cleanText.length > 1000) throw new Error("Комментарий должен содержать от 1 до 1000 символов");
  const sql = await ensureCommunityTables();
  const id = crypto.randomUUID();
  const rows = await sql`INSERT INTO news_comments (id, post_id, user_id, text) VALUES (${id}, ${postId}, ${user.id}, ${cleanText}) RETURNING created_at`;
  return { id, postId, author: user.name, text: cleanText, createdAt: new Date(String(rows[0].created_at)).toISOString() };
}
