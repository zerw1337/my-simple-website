import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPostById, getNextPost, getPreviousPost } from "../api/Posts";
import "./styles/PostCardFull.css";
import PostReactions from "./PostReactions";
import PostComments from "./PostComments";
import UserAvatar from "./UserAvatar";

function PostCardFullWrapper() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prevId, setPrevId] = useState(null);
    const [nextId, setNextId] = useState(null);

    useEffect(() => {
        setLoading(true);
        getPostById(id).then(data => {
            setPost({
                id: data.id, title: data.title,
                author: data.user?.username || "Аноним",
                author_id: data.user?.id || null,
                date: data.created_at, content: data.content,
                category: data.category || null,
                views: data.views ?? 0, rating: data.rating ?? 0,
            });
            setLoading(false);
        }).catch(() => { setError("Не удалось загрузить пост"); setLoading(false); });
        getNextPost(id).then(data => setNextId(data ? data.id : null));
        getPreviousPost(id).then(data => setPrevId(data ? data.id : null));
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

    return <PostCardFull post={post} prevId={prevId} nextId={nextId} />;
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
        }}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}>
            {label}
        </Link>
    );
}

function PostCardFull({ post, prevId, nextId }) {
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
                        <span style={{
                            fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                            padding: "0.25rem 0.75rem", borderRadius: "999px",
                            color: "var(--logo-color)", background: "rgba(4,198,233,0.08)", border: "1px solid rgba(4,198,233,0.2)",
                        }}>
                            {post.category.emoji} {post.category.name}
                        </span>
                    </div>
                )}

                {/* Заголовок */}
                <h1 style={{ margin: "0 0 0.75rem", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "rgb(180,255,255)", lineHeight: 1.2, textShadow: "0 0 20px rgba(180,255,255,0.15)" }}>
                    {post.title}
                </h1>

                {/* Мета с аватаром автора */}
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

                {/* Контент */}
                <div style={{ marginBottom: "2rem", color: "rgb(160,200,235)", lineHeight: 1.85, fontSize: "1rem" }}>
                    <p style={{ margin: 0, whiteSpace: "pre-line" }}>{post.content}</p>
                </div>

                {/* Реакции */}
                <div style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(100,160,220,0.08)", marginBottom: "1.5rem" }}>
                    <PostReactions postId={post.id} />
                </div>

                {/* Комментарии */}
                <div style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(100,160,220,0.08)" }}>
                    <PostComments postId={post.id} />
                </div>

            </div>
        </main>
    );
}

export default PostCardFullWrapper;
