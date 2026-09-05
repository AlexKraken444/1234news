"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, FileText, Link as LinkIcon, LoaderCircle, LockKeyhole, LogOut, Pencil, Sparkles, Upload, Video, X } from "lucide-react";
import Link from "next/link";
import type { NewsPost } from "@/lib/types";

type Status = { kind: "idle" | "loading" | "success" | "error"; message?: string };

export function AdminPanel({ authenticated, initialPosts }: { authenticated: boolean; initialPosts: NewsPost[] }) {
  const [loggedIn, setLoggedIn] = useState(authenticated);
  const [kind, setKind] = useState<"article" | "video">("article");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [posts, setPosts] = useState(initialPosts);
  const [editing, setEditing] = useState<NewsPost | null>(null);

  async function login(formData: FormData) {
    setStatus({ kind: "loading" });
    const response = await fetch("/api/admin/login", { method: "POST", body: formData });
    if (response.ok) { window.location.reload(); }
    else setStatus({ kind: "error", message: "Пароль не подошёл" });
  }

  async function publish(formData: FormData) {
    setStatus({ kind: "loading", message: "Публикуем…" });
    try {
      formData.set("type", kind);
      const response = await fetch("/api/admin/posts", { method: "POST", body: formData });
      if (!response.ok) throw new Error((await response.json()).error || "Не удалось опубликовать");
      const result = await response.json();
      setPosts((current) => [result.post, ...current]);
      setStatus({ kind: "success", message: "Опубликовано! Материал уже в ленте." });
      (document.getElementById("publish-form") as HTMLFormElement)?.reset();
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Что-то пошло не так" });
    }
  }

  async function saveEdit(formData: FormData) {
    if (!editing) return;
    setStatus({ kind: "loading", message: "Сохраняем…" });
    formData.set("id", editing.id);
    formData.set("type", editing.type);
    try {
      const response = await fetch("/api/admin/posts", { method: "PATCH", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить");
      setPosts((current) => current.map((post) => post.id === editing.id ? { ...post, ...result.post, createdAt: post.createdAt } : post));
      setEditing(null);
      setStatus({ kind: "success", message: "Изменения сохранены." });
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
      <section className="manage-posts">
        <motion.div className="manage-heading" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="eyebrow"><Sparkles size={15} /> Опубликовано</span>
          <h2>Твои материалы</h2>
          <p>{posts.length ? "Нажми «Редактировать», чтобы изменить публикацию." : "Здесь появятся опубликованные материалы."}</p>
        </motion.div>
        <div className="admin-post-list">
          {posts.map((post, index) => (
            <motion.article className="admin-post" key={post.id} layout initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(index * .06, .3) }} whileHover={{ x: 6 }}>
              <span className={`post-kind ${post.type}`}>{post.type === "video" ? <Video size={15} /> : <FileText size={15} />}{post.type === "video" ? "Видео" : "Статья"}</span>
              <div><h3>{post.title}</h3><p>{post.description}</p></div>
              <button className="edit-button" onClick={() => { setEditing(post); setStatus({ kind: "idle" }); }}><Pencil size={16} /> Редактировать</button>
            </motion.article>
          ))}
        </div>
      </section>
      <AnimatePresence>
        {editing && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.currentTarget === event.target) setEditing(null); }}>
            <motion.div className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title" initial={{ opacity: 0, scale: .92, y: 28 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94, y: 20 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
              <button className="modal-close" onClick={() => setEditing(null)} aria-label="Закрыть"><X /></button>
              <span className="eyebrow">Редактирование</span>
              <h2 id="edit-title">Обновить материал</h2>
              <form action={saveEdit} key={editing.id}>
                <label>Заголовок<input name="title" defaultValue={editing.title} required maxLength={120} autoFocus /></label>
                <label>Описание<textarea name="description" defaultValue={editing.description} required maxLength={3000} rows={7} /></label>
                {editing.type === "video" && <label>Ссылка на видео<input name="videoUrl" type="url" defaultValue={editing.videoUrl} required /></label>}
                <button className="primary" disabled={status.kind === "loading"}>{status.kind === "loading" ? <LoaderCircle className="spin" /> : <Check size={18} />} Сохранить изменения</button>
                {status.kind === "error" && <p className="form-message error">{status.message}</p>}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
