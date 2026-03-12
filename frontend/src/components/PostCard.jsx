import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPostById, getNextPost, getPreviousPost } from "../api/Posts";
import "./styles/PostCardFull.css"
import PostReactions from "./PostReactions";
import PostComments from "./PostComments";
import mainPostsList from "./MainPostsList.jsx";

function PostCardFullWrapper() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prevId, setPrevId] = useState(null);
    const [nextId, setNextId] = useState(null);

    useEffect(() => {
        getPostById(id)
            .then((data) => {
                const formattedPost = {
                    id: data.id,
                    title: data.title,
                    author: data.user?.username || "Аноним",
                    author_id: data.user?.id || null,
                    date: data.created_at,
                    content: data.content,
                    category: data.category || null,
                    views: data.views ?? 0,
                    rating: data.rating ?? 0,
                };
                setPost(formattedPost);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Не удалось загрузить пост");
                setLoading(false);
            });

        getNextPost(id).then(data => setNextId(data ? data.id : null));
        getPreviousPost(id).then(data => setPrevId(data ? data.id : null));
    }, [id]);

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <div style={{
                width: "48px",
                height: "48px",
                border: "4px solid #333",
                borderTop: "4px solid var(--logo-color)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
    if (error) return <p>{error}</p>;
    if (!post) return <p>Пост не найден</p>;

    return <PostCardFull post={post} prevId={prevId} nextId={nextId} />;
}


function PostCardFull({ post, prevId, nextId }) {
    const navStyle = {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "1rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #333",
    };

    const linkStyle = {
        color: "var(--logo-color)",
        textDecoration: "none",
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 600,
        padding: "0.2rem 0.4rem",
        borderRadius: "4px",
        transition: "all 0.3s ease",
    };

    return (
        <main style={{paddingTop: "3em"}}>
            <div className="full-post-card" style={{
                maxWidth: "800px",
                margin: "2rem auto",
                padding: "1.5rem",
                background: "#1f1f1f",
                color: "#ececec",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                fontFamily: "'Arial', sans-serif",
                lineHeight: "1.6"
            }}>
                <div style={navStyle}>
                    {prevId ? (
                        <a href={`/posts/${prevId}`} style={linkStyle}
                           onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--logo-color)"; e.currentTarget.style.color = "var(--bg-main)"; }}
                           onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--logo-color)"; }}
                        >← Предыдущий</a>
                    ) : <span />}
                    {nextId ? (
                        <a href={`/posts/${nextId}`} style={linkStyle}
                           onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--logo-color)"; e.currentTarget.style.color = "var(--bg-main)"; }}
                           onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--logo-color)"; }}
                        >Следующий →</a>
                    ) : <span />}
                </div>

                <div className="full-post-header" style={{ marginBottom: "1rem" }}>
                    <h2 style={{ margin: 0, fontSize: "2rem" }}>{post.title}</h2>
                    <span style={{ fontSize: "0.9rem", color: "#a0a0a0" }}>
                    {post.date ? new Date(post.date).toLocaleString() : "Неизвестно"}
                </span>
                </div>

                <div className="full-post-meta" style={{ marginBottom: "1rem", display: "flex", gap: "1rem", fontSize: "0.95rem" }}>
                <span>Автор: <b>
                    {post.author_id
                        ? <a href={"/profile/" + post.author_id} style={{ color: "var(--logo-color)", textDecoration: "none" }}
                             onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                             onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                            {post.author}
                        </a>
                        : post.author}
                </b></span>
                    {post.category && (
                        <span>Категория: <b>{post.category.emoji} {post.category.name}</b></span>
                    )}
                    <span style={{ color: "#a0a0a0" }}>👁 {post.views}</span>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#a0a0a0", fontFamily: "'Poppins', sans-serif" }}>Рейтинг</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--logo-color)", fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>{post.rating} / 100</span>
                    </div>
                    <div style={{ background: "#2a2a2a", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
                        <div style={{
                            height: "100%",
                            width: post.rating + "%",
                            background: "linear-gradient(90deg, var(--logo-color), #03b0d0)",
                            borderRadius: "999px",
                            transition: "width 0.5s ease",
                        }} />
                    </div>
                </div>

                <div className="full-post-content">
                    <p>{post.content}</p>
                </div>

                <PostReactions postId={post.id} />
                <PostComments postId={post.id} />
            </div>
        </main>
    );
}

export default PostCardFullWrapper;