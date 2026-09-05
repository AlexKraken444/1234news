"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clapperboard, Newspaper, Play, Radio } from "lucide-react";
import type { NewsPost } from "@/lib/types";

const postDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const today = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

function embedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v") ? `https://www.youtube.com/embed/${parsed.searchParams.get("v")}` : null;
    if (parsed.hostname === "youtu.be") return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("rutube.ru") && parsed.pathname.includes("/video/")) return `https://rutube.ru/play/embed/${parsed.pathname.split("/video/")[1].split("/")[0]}`;
  } catch {}
  return null;
}

function VideoPlayer({ post }: { post: Extract<NewsPost, { type: "video" }> }) {
  const embed = embedUrl(post.videoUrl);
  return embed ? <iframe src={embed} title={post.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video controls preload="metadata" src={post.videoUrl} playsInline />;
}

export function HomePage({ posts }: { posts: NewsPost[] }) {
  const lead = posts[0];
  const latest = posts.slice(1);

  return (
    <main className="news-site">
      <motion.div className="utility-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span className="utility-date">{today}</span><span>Новости нашего класса</span>
      </motion.div>
      <motion.header className="news-header" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .5 }}>
        <a className="news-logo" href="#top"><span>1234</span> NEWS</a>
        <nav aria-label="Основная навигация"><a href="#latest">Последние новости</a><a href="#latest">Выпуски</a></nav>
        <span className="edition">CLASS EDITION</span>
      </motion.header>
      <div className="breaking-strip">
        <span><Radio size={14} /> В центре внимания</span>
        <div className="breaking-window"><motion.p animate={{ x: ["0%", "-50%"] }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }}>СОБЫТИЯ • ЛЮДИ • ПОБЕДЫ • ИДЕИ • СОБЫТИЯ • ЛЮДИ • ПОБЕДЫ • ИДЕИ •</motion.p></div>
      </div>
      <section className="newsroom" id="top">
        {lead ? (
          <motion.article className={`lead-story ${lead.type}`} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .12 }}>
            <div className="lead-copy">
              <div className="story-meta"><span>{lead.type === "video" ? "Видеовыпуск" : "Главная новость"}</span><time>{postDate.format(new Date(lead.createdAt))}</time></div>
              <h1>{lead.title}</h1><p>{lead.description}</p>
              <a href="#latest" className="read-more">Вся лента <ArrowRight size={17} /></a>
            </div>
            <div className="lead-visual">
              {lead.type === "video" ? <><VideoPlayer post={lead} /><span className="player-label"><Play size={14} fill="currentColor" /> Смотреть выпуск</span></> : <div className="editorial-mark"><Newspaper /><strong>ГЛАВНОЕ</strong><span>сегодня</span></div>}
            </div>
          </motion.article>
        ) : (
          <motion.div className="news-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span>Редакция 1234 NEWS</span><h1>Готовим первую новость</h1><p>Свежие материалы скоро появятся на этой странице.</p></motion.div>
        )}
        <section className="latest-section" id="latest">
          <motion.div className="news-section-title" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div><span className="section-number">01</span><h2>Последние новости</h2></div><span className="material-count">{posts.length} материалов</span>
          </motion.div>
          <div className="editorial-grid">
            {latest.map((post, index) => (
              <motion.article className={`news-card ${post.type}`} key={post.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: .5, delay: Math.min(index * .06, .24) }}>
                {post.type === "video" && <div className="news-video"><VideoPlayer post={post} /><span><Play size={13} fill="currentColor" /> Видео</span></div>}
                <div className="news-card-content">
                  <div className="story-meta"><span>{post.type === "video" ? <Clapperboard size={14} /> : <Newspaper size={14} />}{post.type === "video" ? "Выпуск" : "Новости"}</span><time>{postDate.format(new Date(post.createdAt))}</time></div>
                  <h3>{post.title}</h3><p>{post.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </section>
      <footer className="news-footer"><span className="news-logo"><span>1234</span> NEWS</span><p>Независимая редакция нашего класса</p><span>© {new Date().getFullYear()}</span></footer>
    </main>
  );
}
