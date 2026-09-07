import { NextResponse } from "next/server";
import { registerUser } from "@/lib/community";

export async function POST(request: Request) {
  const data = await request.json();
  try {
    return NextResponse.json({ user: await registerUser(String(data.name || ""), String(data.password || "")) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось зарегистрироваться" }, { status: 400 });
  }
}
