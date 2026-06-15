import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPostById, getPostImages } from "../api/Posts";
import "./styles/PostCardFull.css";
import PostReactions from "./PostReactions";
import PostComments from "./PostComments";
import UserAvatar from "./UserAvatar";
import { parseContent } from "./PostContent";

function PostCardFullWrapper() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prevId, setPrevId] = useState(null);
    const [nextId, setNextId] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setImages([]);
        getPostById(id)
            .then(data => {
                setPost({
                    id: data.id,
                    title: data.title,
                    author: data.user?.username || "Аноним",
                    author_id: data.user?.id || null,
                    date: data.created_at,
                    content: data.content,
                    category: data.category || null,
                    views: data.views ?? 0,
                    rating: data.rating ?? 0,
                });

                setNextId(data.next_post_id ?? null);
                setPrevId(data.previous_post_id ?? null);

                setLoading(false);

                getPostImages(data.id).then(imgs => {
                    const sorted = [...imgs].sort((a, b) => a.position - b.position);
                    setImages(sorted);
                });
            })
            .catch(() => { setError("Не удалось загрузить пост"); setLoading(false); });


    }, [id]);

    if (loading) return (
        <main style={{ paddingTop: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
                <div style={{ width: "44px", height: "44px", border: "3px solid rgba(100,160,220,0.15)", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </main>
    );
    if (error) return <main style={{ paddingTop: "3rem" }}><p style={{ textAlign: "center", color: "rgb(80,110,140)" }}>{error}</p></main>;
    if (!post) return <main style={{ paddingTop: "3rem" }}><p style={{ textAlign: "center", color: "rgb(80,110,140)" }}>Пост не найден</p></main>;

    return <PostCardFull post={post} prevId={prevId} nextId={nextId} images={images} />;
}

function NavBtn({ to, label }) {
    const [hov, setHov] = useState(false);
    return (
        <Link to={to} style={{
            color: hov ? "rgb(180,255,255)" : "var(--logo-color)",
            textDecoration: "none", fontWeight: 600, fontFamily: "inherit",
            padding: "0.3rem 0.75rem", borderRadius: "6px",
            border: `1px solid ${hov ? "rgba(180,255,255,0.3)" : "rgba(4,198,233,0.25)"}`,
            background: hov ? "rgba(180,255,255,0.05)" : "transparent",
            fontSize: "0.875rem", transition: "all 0.2s",
        }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
            {label}
        </Link>
    );
}

// Лайтбокс — открывается по клику на картинку в тексте или в галерее внизу
function Lightbox({ images, initialPos, onClose }) {
    // Работаем с отсортированным массивом по position
    const sorted = [...images].sort((a, b) => a.position - b.position);
    const initialIdx = sorted.findIndex(img => img.position === initialPos);
    const [idx, setIdx] = useState(Math.max(0, initialIdx));

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, sorted.length - 1));
            if (e.key === "ArrowLeft") setIdx(i => Math.max(i - 1, 0));
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [sorted.length, onClose]);

    const img = sorted[idx];
    if (!img) return null;

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, cursor: "zoom-out", padding: "1rem" }}>
            {idx > 0 && (
                <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}
                        style={{ position: "absolute", left: "1rem", background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", fontSize: "2rem", cursor: "pointer", borderRadius: "50%", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            )}
            <img src={`data:${img.content_type};base64,${img.data}`} alt={`Фото ${img.position}`}
                 style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "10px", objectFit: "contain" }}
                 onClick={e => e.stopPropagation()} />
            {idx < sorted.length - 1 && (
                <button onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}
                        style={{ position: "absolute", right: "1rem", background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", fontSize: "2rem", cursor: "pointer", borderRadius: "50%", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            )}
            <div style={{ position: "absolute", bottom: "1.25rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                {idx + 1} / {sorted.length}
            </div>
        </div>
    );
}

// Галерея для картинок, которые НЕ были вставлены тегом [img:N] в текст
function PostGallery({ images, usedPositions, onLightbox }) {
    const unused = images.filter(img => !usedPositions.has(img.position));
    if (unused.length === 0) return null;

    return (
        <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: unused.length === 1 ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                {unused.map(img => (
                    <div key={img.position} onClick={() => onLightbox(img.position)}
                         style={{ borderRadius: "10px", overflow: "hidden", cursor: "zoom-in", border: "1px solid rgba(100,160,220,0.12)", background: "rgba(100,160,220,0.04)", aspectRatio: unused.length === 1 ? "auto" : "4/3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={`data:${img.content_type};base64,${img.data}`} alt={`Фото ${img.position}`}
                             style={{ width: "100%", height: "100%", objectFit: unused.length === 1 ? "contain" : "cover", display: "block", transition: "transform 0.2s" }}
                             onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                             onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function PostCardFull({ post, prevId, nextId, images }) {
    const [lightboxPos, setLightboxPos] = useState(null);

    // Собираем позиции картинок, упомянутых в тексте через [img:N]
    const usedPositions = new Set();
    const tagMatches = [...(post.content || "").matchAll(/\[img:(\d+)\]/g)];
    tagMatches.forEach(m => usedPositions.add(parseInt(m[1])));

    const renderedContent = parseContent(post.content, images, (pos) => setLightboxPos(pos));

    return (
        <main style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
            <div className="full-post-card">

                {/* Навигация */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(100,160,220,0.1)" }}>
                    {prevId ? <NavBtn to={`/posts/${prevId}`} label="← Предыдущий" /> : <span />}
                    {nextId ? <NavBtn to={`/posts/${nextId}`} label="Следующий →" /> : <span />}
                </div>

                {/* Категория */}
                {post.category && (
                    <div style={{ marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.25rem 0.75rem", borderRadius: "999px", color: "var(--logo-color)", background: "rgba(4,198,233,0.08)", border: "1px solid rgba(4,198,233,0.2)" }}>
                            {post.category.emoji} {post.category.name}
                        </span>
                    </div>
                )}

                {/* Заголовок */}
                <h1 style={{ margin: "0 0 0.75rem", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "rgb(180,255,255)", lineHeight: 1.2, textShadow: "0 0 20px rgba(180,255,255,0.15)" }}>
                    {post.title}
                </h1>

                {/* Мета */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem 1.25rem", fontSize: "0.82rem", color: "rgb(80,110,140)", marginBottom: "1.5rem", alignItems: "center" }}>
                    {post.author_id ? (
                        <Link to={`/profile/${post.author_id}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--logo-color)", textDecoration: "none", fontWeight: 600 }}
                              onMouseEnter={e => e.currentTarget.style.color = "rgb(180,255,255)"}
                              onMouseLeave={e => e.currentTarget.style.color = "var(--logo-color)"}>
                            <UserAvatar userId={post.author_id} username={post.author} size={38} />
                            {post.author}
                        </Link>
                    ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgb(120,155,190)", fontWeight: 600 }}>
                            <UserAvatar username={post.author} size={38} />
                            {post.author}
                        </span>
                    )}
                    <span>{new Date(post.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span>👁 {post.views} просмотров</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <span style={{ color: "rgba(4,198,233,0.6)", fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>Рейтинг</span>
                        <span style={{ color: "var(--logo-color)", fontWeight: 700 }}>{post.rating}</span>
                        <span style={{ color: "rgb(40,60,90)" }}>/100</span>
                    </span>
                </div>

                {/* Прогресс-бар рейтинга */}
                <div style={{ marginBottom: "1.75rem" }}>
                    <div style={{ background: "rgba(100,160,220,0.08)", borderRadius: "999px", height: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: post.rating + "%", background: "linear-gradient(90deg, var(--logo-color), rgb(180,255,255))", borderRadius: "999px", transition: "width 0.6s ease" }} />
                    </div>
                </div>

                {/* Контент с форматированием */}
                <div style={{ color: "rgb(160,200,235)", fontSize: "1rem" }}>
                    {renderedContent}
                </div>

                {/* Галерея незадействованных картинок */}
                <PostGallery images={images} usedPositions={usedPositions} onLightbox={setLightboxPos} />

                {/* Реакции */}
                <div style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(100,160,220,0.08)", marginBottom: "1.5rem" }}>
                    <PostReactions postId={post.id} />
                </div>

                {/* Комментарии */}
                <div style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(100,160,220,0.08)" }}>
                    <PostComments postId={post.id} />
                </div>

            </div>

            {/* Лайтбокс */}
            {lightboxPos !== null && images.length > 0 && (
                <Lightbox images={images} initialPos={lightboxPos} onClose={() => setLightboxPos(null)} />
            )}
        </main>
    );
}

export default PostCardFullWrapper;