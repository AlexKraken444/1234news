"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, FileText, Film, Link as LinkIcon, LoaderCircle, LockKeyhole, LogOut, Megaphone, Pencil, Sparkles, Trash2, Upload, UploadCloud, Video, X } from "lucide-react";
import Link from "next/link";
import type { NewsPost } from "@/lib/types";

type Status = { kind: "idle" | "loading" | "success" | "error"; message?: string };
const MAX_VIDEO_SIZE = 80 * 1024 * 1024;
const VIDEO_CHUNK_SIZE = 1024 * 1024;

export function AdminPanel({ authenticated, initialPosts, initialTickerText }: { authenticated: boolean; initialPosts: NewsPost[]; initialTickerText: string }) {
  const [loggedIn, setLoggedIn] = useState(authenticated);
  const [kind, setKind] = useState<"article" | "video">("article");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [posts, setPosts] = useState(initialPosts);
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tickerText, setTickerText] = useState(initialTickerText);
  const [tickerStatus, setTickerStatus] = useState<Status>({ kind: "idle" });
  const videoInput = useRef<HTMLInputElement>(null);

  function chooseVideo(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/")) return setStatus({ kind: "error", message: "Перетащи видеофайл" });
    if (file.size > MAX_VIDEO_SIZE) return setStatus({ kind: "error", message: "Видео должно быть не больше 80 МБ" });
    setVideoFile(file);
    setStatus({ kind: "idle" });
  }

  async function uploadVideo(file: File) {
    const id = crypto.randomUUID();
    const chunkCount = Math.ceil(file.size / VIDEO_CHUNK_SIZE);
    for (let index = 0; index < chunkCount; index++) {
      const percent = Math.round((index / chunkCount) * 100);
      setStatus({ kind: "loading", message: `Загружаем видео: ${percent}%` });
      const response = await fetch("/api/admin/videos", {
        method: "POST",
        headers: {
          "x-video-id": id,
          "x-file-name": encodeURIComponent(file.name),
          "x-content-type": file.type,
          "x-total-size": String(file.size),
          "x-chunk-count": String(chunkCount),
          "x-chunk-index": String(index),
        },
        body: file.slice(index * VIDEO_CHUNK_SIZE, Math.min((index + 1) * VIDEO_CHUNK_SIZE, file.size)),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Не удалось загрузить видео");
    }
    return `/api/videos/${id}`;
  }

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
      if (kind === "video" && videoFile) formData.set("videoUrl", await uploadVideo(videoFile));
      const response = await fetch("/api/admin/posts", { method: "POST", body: formData });
      if (!response.ok) throw new Error((await response.json()).error || "Не удалось опубликовать");
      const result = await response.json();
      setPosts((current) => [result.post, ...current]);
      setStatus({ kind: "success", message: "Опубликовано! Материал уже в ленте." });
      setVideoFile(null);
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

  async function removePost(post: NewsPost) {
    if (!window.confirm(`Удалить «${post.title}»? Отменить это действие будет нельзя.`)) return;
    setDeletingId(post.id);
    setStatus({ kind: "loading", message: "Удаляем…" });
    try {
      const response = await fetch("/api/admin/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось удалить");
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setStatus({ kind: "success", message: "Материал удалён." });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Что-то пошло не так" });
    } finally {
      setDeletingId(null);
    }
  }

  async function updateTicker(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTickerStatus({ kind: "loading", message: "Сохраняем…" });
    try {
      const response = await fetch("/api/admin/ticker", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: tickerText }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить");
      setTickerText(result.text);
      setTickerStatus({ kind: "success", message: "Бегущая строка обновлена." });
    } catch (error) {
      setTickerStatus({ kind: "error", message: error instanceof Error ? error.message : "Что-то пошло не так" });
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
            {kind === "video" && <>
              <div
                className={`video-dropzone${dragging ? " dragging" : ""}${videoFile ? " selected" : ""}`}
                onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
                onDrop={(event) => { event.preventDefault(); setDragging(false); chooseVideo(event.dataTransfer.files[0]); }}
                onClick={() => videoInput.current?.click()}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") videoInput.current?.click(); }}
                role="button"
                tabIndex={0}
              >
                <input ref={videoInput} className="visually-hidden" type="file" accept="video/*" onChange={(event) => chooseVideo(event.target.files?.[0])} />
                {videoFile ? <>
                  <span className="drop-icon"><Film /></span>
                  <strong>{videoFile.name}</strong>
                  <small>{(videoFile.size / 1024 / 1024).toFixed(1)} МБ · готово к загрузке</small>
                  <button type="button" className="remove-video" onClick={(event) => { event.stopPropagation(); setVideoFile(null); if (videoInput.current) videoInput.current.value = ""; }}><Trash2 size={16} /> Убрать</button>
                </> : <>
                  <span className="drop-icon"><UploadCloud /></span>
                  <strong>Перетащи видео сюда</strong>
                  <small>или нажми, чтобы выбрать файл · до 80 МБ</small>
                </>}
              </div>
              <div className="video-or"><span>или добавь ссылку</span></div>
              <label className="upload-field"><span><LinkIcon /> Ссылка на видео</span><input name="videoUrl" type="url" placeholder="https://youtube.com/watch?v=…" required={!videoFile} /><small>YouTube, Rutube, VK Video или прямая ссылка</small></label>
            </>}
            <button className="primary publish" disabled={status.kind === "loading"}>{status.kind === "loading" ? <LoaderCircle className="spin" /> : <Upload size={18} />} {status.kind === "loading" ? status.message : "Опубликовать"}</button>
            {status.kind === "success" && <p className="form-message success"><Check size={18} /> {status.message}</p>}
            {status.kind === "error" && <p className="form-message error">{status.message}</p>}
          </form>
        </motion.div>
      </section>
      <section className="ticker-editor-section">
        <motion.div className="ticker-editor" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="ticker-editor-copy">
            <span className="icon-box"><Megaphone /></span>
            <span className="eyebrow">Бегущая строка</span>
            <h2>Короткие новости</h2>
            <p>Напиши объявления или новости для бесконечной ленты. Разделяй сообщения знаком •</p>
          </div>
          <form onSubmit={updateTicker}>
            <label>Текст ленты<textarea value={tickerText} onChange={(event) => setTickerText(event.target.value)} required minLength={3} maxLength={500} rows={5} placeholder="ЗАВТРА КОНТРОЛЬНАЯ • МЫ ВЫИГРАЛИ МАТЧ" /></label>
            <div className="ticker-preview"><div>{tickerText || "Текст появится здесь"} • {tickerText || "Текст появится здесь"} •</div></div>
            <button className="primary" disabled={tickerStatus.kind === "loading"}>{tickerStatus.kind === "loading" ? <LoaderCircle className="spin" /> : <Check size={18} />} {tickerStatus.kind === "loading" ? tickerStatus.message : "Обновить ленту"}</button>
            {tickerStatus.kind === "success" && <p className="form-message success"><Check size={18} /> {tickerStatus.message}</p>}
            {tickerStatus.kind === "error" && <p className="form-message error">{tickerStatus.message}</p>}
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
              <div className="post-actions">
                <button className="edit-button" onClick={() => { setEditing(post); setStatus({ kind: "idle" }); }}><Pencil size={16} /> Редактировать</button>
                <button className="delete-button" disabled={deletingId === post.id} onClick={() => removePost(post)}>{deletingId === post.id ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />} Удалить</button>
              </div>
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
