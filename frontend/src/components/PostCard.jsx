import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPostById } from "../api/Posts";
import "./styles/PostCardFull.css"

function PostCardFullWrapper() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getPostById(id)
            .then((data) => {
                const formattedPost = {
                    id: data.id,
                    title: data.title,
                    user: data.user || null,
                    created_at: data.created_at,
                    content: data.content,
                    category: data.category || null,
                    image: data.image || null,
                };
                setPost(formattedPost);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Не удалось загрузить пост");
                setLoading(false);
            });
    }, [id]);

    if (loading) return <p>Загрузка поста...</p>;
    if (error) return <p>{error}</p>;
    if (!post) return <p>Пост не найден</p>;

    return <PostCardFull post={post} />;
}


function PostCardFull({ post }) {
    return (
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
            {/* Заголовок и дата */}
            <div className="full-post-header" style={{ marginBottom: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "2rem" }}>{post.title}</h2>
                <span style={{ fontSize: "0.9rem", color: "#a0a0a0" }}>
                    {post.created_at ? new Date(post.created_at).toLocaleString() : "Неизвестно"}
                </span>
            </div>

            {/* Автор и категория */}
            <div className="full-post-meta" style={{ marginBottom: "1rem", display: "flex", gap: "1rem", fontSize: "0.95rem" }}>
                <span>Автор: <b>{post.user?.username || "Аноним"}</b></span>
                {post.category && (
                    <span>Категория: <b>{post.category.emoji} {post.category.name}</b></span>
                )}
            </div>

            {/* Контент */}
            <div className="full-post-content">
                <p>{post.content}</p>
            </div>
        </div>
    );
}


export default PostCardFullWrapper;