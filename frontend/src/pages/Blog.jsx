import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getAllPosts, getTopViewedPosts, getTopRatedPosts } from "../api/Posts";

function Blog() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [posts, setPosts] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [sort, setSort] = useState("default"); // "default" | "views" | "rating"
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCategories().then(setCategories);
    }, []);

    useEffect(() => {
        setLoading(true);
        const fetcher = sort === "views" ? getTopViewedPosts : sort === "rating" ? getTopRatedPosts : getAllPosts;
        fetcher().then(ps => { setPosts(ps); setLoading(false); });
    }, [sort]);

    const filteredPosts = activeCategory
        ? posts.filter(p => p.category?.id === activeCategory)
        : posts;

    if (loading) return (
        <main>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
                <div style={{
                    width: "48px", height: "48px",
                    border: "4px solid #333",
                    borderTop: "4px solid var(--logo-color)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </main>
    );

    return (
        <main style={{paddingTop: "3rem"}}>
            <div style={{ maxWidth: "800px", margin: "2rem auto" }}>

                <h2 style={{ marginBottom: "1rem" }}>Блог</h2>

                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    {[
                        { key: "default", label: "📅 Новые" },
                        { key: "views",   label: "👁 По просмотрам" },
                        { key: "rating",  label: "⭐ По рейтингу" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => { setSort(key); setActiveCategory(null); }}
                            style={{
                                padding: "0.35rem 1rem",
                                borderRadius: "20px",
                                border: "1px solid " + (sort === key ? "var(--logo-color)" : "#444"),
                                background: sort === key ? "var(--logo-color)" : "transparent",
                                color: sort === key ? "var(--bg-main)" : "#a0a0a0",
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
                    <button
                        onClick={() => setActiveCategory(null)}
                        style={{
                            padding: "0.4rem 1rem",
                            borderRadius: "20px",
                            border: "1px solid " + (activeCategory === null ? "var(--logo-color)" : "#444"),
                            background: activeCategory === null ? "var(--logo-color)" : "transparent",
                            color: activeCategory === null ? "var(--bg-main)" : "#a0a0a0",
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        {"Все (" + posts.length + ")"}
                    </button>
                    {categories.map(cat => {
                        const isActive = activeCategory === cat.id;
                        const count = posts.filter(p => p.category?.id === cat.id).length;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                                style={{
                                    padding: "0.4rem 1rem",
                                    borderRadius: "20px",
                                    border: "1px solid " + (isActive ? "var(--logo-color)" : "#444"),
                                    background: isActive ? "var(--logo-color)" : "transparent",
                                    color: isActive ? "var(--bg-main)" : "#a0a0a0",
                                    fontFamily: "'Poppins', sans-serif",
                                    fontWeight: 600,
                                    fontSize: "0.9rem",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                {cat.emoji + " " + cat.name + " (" + count + ")"}
                            </button>
                        );
                    })}
                </div>

                <hr style={{ borderColor: "#333", marginBottom: "1.5rem" }} />

                {filteredPosts.length === 0 ? (
                    <p style={{ color: "#a0a0a0" }}>Постов в этой категории пока нет.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {filteredPosts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => navigate("/posts/" + post.id)}
                                style={{
                                    background: "#1f1f1f",
                                    border: "1px solid #333",
                                    borderRadius: "10px",
                                    padding: "1rem 1.25rem",
                                    transition: "border-color 0.2s",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--logo-color)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#333"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem", flexWrap: "wrap", gap: "0.25rem" }}>
                                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--main-text-color)" }}>
                                        {post.title}
                                    </span>
                                    <span style={{ fontSize: "0.8rem", color: "#a0a0a0", whiteSpace: "nowrap", marginLeft: "1rem" }}>
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                                    <a
                                        href={"/profile/" + post.user?.id}
                                        style={{ color: "var(--logo-color)", textDecoration: "none" }}
                                        onClick={e => e.stopPropagation()}
                                        onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
                                        onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}
                                    >
                                        {post.user?.username || "Аноним"}
                                    </a>
                                    {post.category && (
                                        <span>{post.category.emoji + " " + post.category.name}</span>
                                    )}
                                    <span style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
                                        <span>👁 {post.views ?? 0}</span>
                                        <span>⭐ {post.rating ?? 0}</span>
                                    </span>
                                </div>
                                <p style={{
                                    margin: 0,
                                    fontSize: "0.9rem",
                                    color: "#a0a0a0",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}>
                                    {post.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </main>
    );
}

export default Blog;
