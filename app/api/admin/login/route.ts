import { NextResponse } from "next/server";
import { checkPassword, createAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const data = await request.formData();
  const password = String(data.get("password") || "");
  if (!checkPassword(password)) return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  await createAdminSession();
  return NextResponse.json({ ok: true });
}
