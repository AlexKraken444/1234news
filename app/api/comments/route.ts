import { NextResponse } from "next/server";
import { createComment, getCurrentUser } from "@/lib/community";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войди в аккаунт, чтобы комментировать" }, { status: 401 });
  const data = await request.json();
  try {
    return NextResponse.json({ comment: await createComment(String(data.postId || ""), user, String(data.text || "")) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось отправить комментарий" }, { status: 400 });
  }
}
