"use client";

import { motion } from "framer-motion";
import { ArrowDown, Clapperboard, Newspaper, Play } from "lucide-react";
import type { NewsPost } from "@/lib/types";

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

export function HomePage({ posts }: { posts: NewsPost[] }) {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="1234 NEWS — наверх">
          <span>1234</span> NEWS
        </a>
        <a className="nav-link" href="#news">Все новости <ArrowDown size={16} /></a>
      </header>

      <section className="hero" id="top">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
          <h1>Всё, чем живёт<br />наш <em>класс</em></h1>
          <p>Новости, события и свежие выпуски — без скучных объявлений и мелкого шрифта.</p>
        </motion.div>
        <motion.div className="hero-stamp" initial={{ opacity: 0, rotate: -18, scale: .7 }} animate={{ opacity: 1, rotate: -8, scale: 1 }} transition={{ delay: .35, type: "spring" }}>
          <span>только</span><strong>СВЕЖЕЕ</strong><span>для своих</span>
        </motion.div>
        <div className="ticker" aria-hidden="true"><div>КЛАССНЫЕ НОВОСТИ • БЕЗ СПЛЕТЕН • ПОЧТИ • КЛАССНЫЕ НОВОСТИ • БЕЗ СПЛЕТЕН • ПОЧТИ •</div></div>
      </section>

      <section className="feed" id="news">
        <div className="section-heading">
          <div><span>01 / ЛЕНТА</span><h2>Последние новости</h2></div>
          <span className="count">{String(posts.length).padStart(2, "0")} материалов</span>
        </div>

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
              </motion.article>
            ))}
          </div>
        )}
      </section>
      <footer><span className="brand"><span>1234</span> NEWS</span><p>Сделано нашим классом — для нашего класса.</p></footer>
    </main>
  );
}
