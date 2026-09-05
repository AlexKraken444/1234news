import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { saveTickerText } from "@/lib/settings";

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  const text = String((await request.json()).text || "").replace(/\s+/g, " ").trim();
  if (text.length < 3 || text.length > 500) return NextResponse.json({ error: "Текст должен содержать от 3 до 500 символов" }, { status: 400 });
  try {
    await saveTickerText(text);
    return NextResponse.json({ ok: true, text });
  } catch (error) {
    console.error("Could not save ticker text", error);
    return NextResponse.json({ error: "Не удалось сохранить бегущую строку" }, { status: 503 });
  }
}
