"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, FileText, Link as LinkIcon, LoaderCircle, LockKeyhole, LogOut, Upload, Video } from "lucide-react";
import Link from "next/link";

type Status = { kind: "idle" | "loading" | "success" | "error"; message?: string };

export function AdminPanel({ authenticated }: { authenticated: boolean }) {
  const [loggedIn, setLoggedIn] = useState(authenticated);
  const [kind, setKind] = useState<"article" | "video">("article");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function login(formData: FormData) {
    setStatus({ kind: "loading" });
    const response = await fetch("/api/admin/login", { method: "POST", body: formData });
    if (response.ok) { setLoggedIn(true); setStatus({ kind: "idle" }); }
    else setStatus({ kind: "error", message: "Пароль не подошёл" });
  }

  async function publish(formData: FormData) {
    setStatus({ kind: "loading", message: "Публикуем…" });
    try {
      formData.set("type", kind);
      const response = await fetch("/api/admin/posts", { method: "POST", body: formData });
      if (!response.ok) throw new Error((await response.json()).error || "Не удалось опубликовать");
      setStatus({ kind: "success", message: "Опубликовано! Материал уже в ленте." });
      (document.getElementById("publish-form") as HTMLFormElement)?.reset();
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Что-то пошло не так" });
    }
  }

  if (!loggedIn) return (
    <main className="admin-shell login-shell">
      <Link href="/" className="back"><ArrowLeft size={17} /> На сайт</Link>
      <motion.form action={login} className="login-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <span className="icon-box"><LockKeyhole /></span>
        <span className="eyebrow">Только для редакции</span>
        <h1>Вход в админку</h1>
        <p>Введи пароль, чтобы публиковать новости и выпуски.</p>
        <label>Пароль<input name="password" type="password" required autoFocus placeholder="••••••••••••" /></label>
        <button className="primary" disabled={status.kind === "loading"}>{status.kind === "loading" ? <LoaderCircle className="spin" /> : <LockKeyhole size={18} />} Войти</button>
        {status.kind === "error" && <p className="form-message error">{status.message}</p>}
      </motion.form>
    </main>
  );

  return (
    <main className="admin-shell">
      <header className="admin-header"><Link href="/" className="brand"><span>1234</span> NEWS</Link><div><span className="admin-badge">РЕДАКЦИЯ</span><button className="icon-button" title="Выйти" onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); setLoggedIn(false); }}><LogOut size={19} /></button></div></header>
      <section className="editor">
        <div className="editor-intro"><span className="eyebrow">Новая публикация</span><h1>Что случилось?</h1><p>Материал появится на главной сразу после публикации.</p></div>
        <motion.div className="editor-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="type-switch">
            <button className={kind === "article" ? "active" : ""} onClick={() => setKind("article")}><FileText size={19} /> Статья</button>
            <button className={kind === "video" ? "active" : ""} onClick={() => setKind("video")}><Video size={19} /> Видеовыпуск</button>
          </div>
          <form id="publish-form" action={publish}>
            <label>Заголовок<input name="title" required maxLength={120} placeholder={kind === "article" ? "Например: Мы выиграли олимпиаду" : "Например: Выпуск №7"} /></label>
            <label>Описание<textarea name="description" required maxLength={3000} rows={7} placeholder="Расскажи самое важное…" /></label>
            {kind === "video" && <label className="upload-field"><span><LinkIcon /> Ссылка на видео</span><input name="videoUrl" type="url" placeholder="https://youtube.com/watch?v=…" required /><small>YouTube, Rutube, VK Video или прямая ссылка на MP4/WebM</small></label>}
            <button className="primary publish" disabled={status.kind === "loading"}>{status.kind === "loading" ? <LoaderCircle className="spin" /> : <Upload size={18} />} {status.kind === "loading" ? status.message : "Опубликовать"}</button>
            {status.kind === "success" && <p className="form-message success"><Check size={18} /> {status.message}</p>}
            {status.kind === "error" && <p className="form-message error">{status.message}</p>}
          </form>
        </motion.div>
      </section>
    </main>
  );
}
