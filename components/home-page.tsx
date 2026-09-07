"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Check, Clapperboard, LoaderCircle, LogIn, LogOut, MessageCircle, Newspaper, Play, Send, UserPlus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { NewsPost } from "@/lib/types";
import type { NewsComment, PublicUser } from "@/lib/community";

const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function embedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v") ? `https://www.youtube.com/embed/${parsed.searchParams.get("v")}` : null;
    if (parsed.hostname === "youtu.be") return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("rutube.ru") && parsed.pathname.includes("/video/")) return `https://rutube.ru/play/embed/${parsed.pathname.split("/video/")[1].split("/")[0]}`;
  } catch {}
  return null;
}

export function HomePage({ posts, tickerText, initialComments, currentUser }: { posts: NewsPost[]; tickerText: string; initialComments: NewsComment[]; currentUser: PublicUser | null }) {
  const tickerLine = Array(12).fill(tickerText).join(" • ") + " • ";
  const tickerTrack = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState(initialComments);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<Record<string, string>>({});

  useEffect(() => {
    const track = tickerTrack.current;
    if (!track) return;
    const setConstantSpeed = () => {
      const loopWidth = track.scrollWidth / 2;
      track.style.animationDuration = `${Math.max(loopWidth / 90, 1)}s`;
    };
    setConstantSpeed();
    const observer = new ResizeObserver(setConstantSpeed);
    observer.observe(track);
    return () => observer.disconnect();
  }, [tickerText]);

  async function submitAuth(formData: FormData) {
    if (!authMode) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await fetch(`/api/account/${authMode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.get("name"), password: formData.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось продолжить");
      window.location.reload();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Что-то пошло не так");
      setAuthLoading(false);
    }
  }

  async function submitComment(postId: string, formData: FormData) {
    const text = String(formData.get("text") || "").trim();
    if (!text) return;
    setCommentLoading(postId);
    setCommentError((current) => ({ ...current, [postId]: "" }));
    try {
      const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, text }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось отправить комментарий");
      setComments((current) => [...current, result.comment]);
      (document.getElementById(`comment-${postId}`) as HTMLFormElement)?.reset();
    } catch (error) {
      setCommentError((current) => ({ ...current, [postId]: error instanceof Error ? error.message : "Что-то пошло не так" }));
    } finally {
      setCommentLoading(null);
    }
  }

  return (
    <main>
      <motion.header className="topbar" initial={{ y: -78 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 180, damping: 22 }}>
        <a className="brand" href="#top" aria-label="1234 NEWS — наверх">
          <Image className="brand-logo" src="/1234-logo.png" alt="1234 NEWS" width={170} height={124} priority />
        </a>
        <div className="topbar-actions">
          <a className="nav-link" href="#news">Все новости <ArrowDown size={16} /></a>
          {currentUser ? <>
            <span className="user-chip">{currentUser.name}</span>
            <button className="account-button quiet" onClick={async () => { await fetch("/api/account/logout", { method: "POST" }); window.location.reload(); }}><LogOut size={17} /> Выйти</button>
          </> : <>
            <button className="account-button quiet" onClick={() => setAuthMode("login")}><LogIn size={17} /> Войти</button>
            <button className="account-button" onClick={() => setAuthMode("register")}><UserPlus size={17} /> Регистрация</button>
          </>}
        </div>
      </motion.header>

      <section className="hero" id="top">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
          <h1>Всё, чем живёт<br />наш <em>класс</em></h1>
          <p>Новости, события и свежие выпуски — без скучных объявлений и мелкого шрифта.</p>
        </motion.div>
        <motion.div className="hero-stamp" initial={{ opacity: 0, rotate: -18, scale: .7 }} animate={{ opacity: 1, rotate: [-8, -4, -8], scale: 1, y: [0, -8, 0] }} transition={{ opacity: { delay: .35 }, scale: { delay: .35, type: "spring" }, rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" }, y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } }}>
          <span>только</span><strong>СВЕЖЕЕ</strong><span>для своих</span>
        </motion.div>
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track" ref={tickerTrack}>
            <span>{tickerLine}&nbsp;</span>
            <span>{tickerLine}&nbsp;</span>
          </div>
        </div>
      </section>

      <section className="feed" id="news">
        <motion.div className="section-heading" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: .55 }}>
          <div><span>01 / ЛЕНТА</span><h2>Последние новости</h2></div>
          <span className="count">{String(posts.length).padStart(2, "0")} материалов</span>
        </motion.div>

        {posts.length === 0 ? (
          <motion.div className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Newspaper size={42} />
            <h3>Редакция уже на связи</h3>
            <p>Первая новость скоро появится здесь. Проверяй ленту!</p>
          </motion.div>
        ) : (
          <div className="post-grid">
            {posts.map((post, index) => (
              <motion.article className={`post-card ${post.type}`} key={post.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: Math.min(index * .08, .3) }}>
                {post.type === "video" && (
                  <div className="video-wrap">
                    {embedUrl(post.videoUrl) ? <iframe src={embedUrl(post.videoUrl)!} title={post.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video controls preload="metadata" src={post.videoUrl} playsInline />}
                    <span className="video-badge"><Play size={14} fill="currentColor" /> ВЫПУСК</span>
                  </div>
                )}
                <div className="card-body">
                  <div className="meta"><span>{post.type === "video" ? <Clapperboard size={15} /> : <Newspaper size={15} />}{post.type === "video" ? "Видео" : "Статья"}</span><time>{date.format(new Date(post.createdAt))}</time></div>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                </div>
                <div className="comments-area">
                  <button className="comments-toggle" onClick={() => setOpenComments(openComments === post.id ? null : post.id)}>
                    <MessageCircle size={18} /> Комментарии <span>{comments.filter((comment) => comment.postId === post.id).length}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openComments === post.id && <motion.div className="comments-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div className="comment-list">
                        {comments.filter((comment) => comment.postId === post.id).length ? comments.filter((comment) => comment.postId === post.id).map((comment) => <div className="comment" key={comment.id}>
                          <div><strong>{comment.author}</strong><time>{date.format(new Date(comment.createdAt))}</time></div>
                          <p>{comment.text}</p>
                        </div>) : <p className="no-comments">Комментариев пока нет. Будь первым!</p>}
                      </div>
                      {currentUser ? <form id={`comment-${post.id}`} className="comment-form" action={(formData) => submitComment(post.id, formData)}>
                        <textarea name="text" required maxLength={1000} rows={3} placeholder="Напиши комментарий…" />
                        <button disabled={commentLoading === post.id}>{commentLoading === post.id ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Отправить</button>
                        {commentError[post.id] && <p className="comment-error">{commentError[post.id]}</p>}
                      </form> : <button className="login-to-comment" onClick={() => setAuthMode("login")}><LogIn size={17} /> Войди, чтобы написать комментарий</button>}
                    </motion.div>}
                  </AnimatePresence>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
      <AnimatePresence>
        {authMode && <motion.div className="account-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthMode(null); }}>
          <motion.div className="account-modal" initial={{ opacity: 0, scale: .92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}>
            <button className="account-modal-close" onClick={() => setAuthMode(null)} aria-label="Закрыть"><X /></button>
            <span className="icon-box">{authMode === "register" ? <UserPlus /> : <LogIn />}</span>
            <span className="eyebrow">{authMode === "register" ? "Новый аккаунт" : "С возвращением"}</span>
            <h2>{authMode === "register" ? "Регистрация" : "Вход"}</h2>
            <form action={submitAuth}>
              <label>Имя<input name="name" required minLength={2} maxLength={30} autoComplete="username" autoFocus placeholder="Как тебя зовут?" /></label>
              <label>Пароль<input name="password" type="password" required minLength={6} maxLength={100} autoComplete={authMode === "register" ? "new-password" : "current-password"} placeholder="Минимум 6 символов" /></label>
              <button className="primary" disabled={authLoading}>{authLoading ? <LoaderCircle className="spin" /> : <Check size={18} />} {authMode === "register" ? "Создать аккаунт" : "Войти"}</button>
              {authError && <p className="form-message error">{authError}</p>}
            </form>
            <button className="switch-auth" onClick={() => { setAuthError(""); setAuthMode(authMode === "register" ? "login" : "register"); }}>{authMode === "register" ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}</button>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
      <footer><Image className="footer-logo" src="/1234-logo.png" alt="1234 NEWS" width={210} height={153} /><p>Сделано нашим классом — для нашего класса.</p></footer>
    </main>
  );
}
