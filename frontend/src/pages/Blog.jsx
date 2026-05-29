import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getAllPosts, getTopViewedPosts, getTopRatedPosts } from "../api/Posts";
import BlogMainImg from "../assets/images/blog-main-img.gif";
import { stripTags } from "../components/PostContent";

const S = {
    card: {
        background: "#262626",
        border: "1px solid rgba(100,160,220,0.12)",
        borderRadius: "10px",
        padding: "1.4em",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }
};

function Blog() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [allPosts, setAllPosts] = useState({ default: [], views: [], rating: [] });
    const [activeCategory, setActiveCategory] = useState(null);
    const [sort, setSort] = useState("default");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getCategories(),
            getAllPosts(),
            getTopViewedPosts(),
            getTopRatedPosts(),
        ]).then(([cats, def, views, rating]) => {
            setCategories(cats);
            setAllPosts({ default: def, views, rating });
            setLoading(false);
        });
    }, []);

    const posts = allPosts[sort];

    const filteredPosts = activeCategory
        ? posts.filter(p => p.category?.id === activeCategory)
        : posts;

    if (loading) return (
        <main>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
                <div className="spinner" />
            </div>
        </main>
    );

    return (
        <main style={{ paddingTop: "3rem" }}>
            <style>{`
                .spinner {
                    width: 48px; height: 48px;
                    border: 4px solid #333;
                    border-top: 4px solid var(--logo-color);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .post-card:hover {
                    border-color: rgba(180,255,255,0.2);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(4,198,233,0.05);
                }
            `}</style>

            <div style={{ maxWidth: "1200px", margin: "2rem auto" }}>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", width: "100%", maxWidth: "1200px", margin: "0 auto 3rem auto", padding: "2rem 1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 400px", minWidth: "280px", textAlign: "left" }}>
                        <h2 style={{ fontSize: "2.8rem", fontWeight: "700", marginBottom: "0.8rem", color: "rgb(180, 255, 255)", textShadow: "0 0 6px rgba(180,255,255,0.5), 0 0 12px rgba(4,198,233,0.3)" }}>
                            БЛОГ
                        </h2>
                        <p style={{ fontSize: "1.15rem", color: "rgb(180, 220, 255)", lineHeight: "1.7", maxWidth: "500px" }}>
                            Пишу свои мысли о всём: кинематограф, игры, технологии и многое другое.
                        </p>
                    </div>
                    <div style={{ flex: "1 1 300px", minWidth: "280px", position: "relative" }}>
                        <img src={BlogMainImg} alt="" style={{ maxWidth: "100%", borderRadius: "1rem", boxShadow: "0 12px 35px rgba(0,0,0,0.25)", filter: "brightness(70%)", userSelect: "none" }} draggable={false} />
                    </div>
                </div>

                {/* Сортировка */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    {[
                        { key: "default", label: "📅 Новые" },
                        { key: "views",   label: "👁 По просмотрам" },
                        { key: "rating",  label: "⭐ По рейтингу" },
                    ].map(({ key, label }) => (
                        <button key={key} onClick={() => { setSort(key); setActiveCategory(null); }}
                                style={{ padding: "0.3rem 0.9rem", borderRadius: "50px", border: "1px solid transparent", background: sort === key ? "linear-gradient(90deg, rgba(4,198,233,0.8), rgba(180,255,255,0.7))" : "rgba(255,255,255,0.05)", color: sort === key ? "#1f1f1f" : "#a0a0a0", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.25s ease", boxShadow: sort === key ? "0 4px 12px rgba(4,198,233,0.3)" : "none" }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Категории */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
                    <button onClick={() => setActiveCategory(null)}
                            style={{ padding: "0.3rem 0.9rem", borderRadius: "50px", border: "1px solid transparent", background: activeCategory === null ? "linear-gradient(90deg, rgba(4,198,233,0.8), rgba(180,255,255,0.7))" : "rgba(255,255,255,0.05)", color: activeCategory === null ? "#1f1f1f" : "#a0a0a0", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
                        {"Все (" + posts.length + ")"}
                    </button>
                    {categories.map(cat => {
                        const isActive = activeCategory === cat.id;
                        const count = posts.filter(p => p.category?.id === cat.id).length;
                        return (
                            <button key={cat.id} onClick={() => setActiveCategory(isActive ? null : cat.id)}
                                    style={{ padding: "0.3rem 0.9rem", borderRadius: "50px", border: "1px solid transparent", background: isActive ? "linear-gradient(90deg, rgba(4,198,233,0.8), rgba(180,255,255,0.7))" : "rgba(255,255,255,0.05)", color: isActive ? "#1f1f1f" : "#a0a0a0", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
                                {cat.emoji + " " + cat.name + " (" + count + ")"}
                            </button>
                        );
                    })}
                </div>

                <div style={{ width: "100%", overflow: "hidden", lineHeight: 0, margin: "2rem 0" }}>
                    <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{ width: "100%", height: "40px", display: "block" }}>
                        <path d="M0,30 C150,20 300,40 450,30 C600,20 750,40 900,30 C1050,20 1200,30 1200,30"
                              style={{ fill: "none", stroke: "rgb(180, 255, 255)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.7 }} />
                    </svg>
                </div>

                {filteredPosts.length === 0 ? (
                    <p style={{ color: "rgb(100,130,160)", textAlign: "center", marginTop: "3rem" }}>Постов не найдено</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                        {filteredPosts.map(post => (
                            <div key={post.id} className="post-card" style={S.card} onClick={() => navigate("/posts/" + post.id)}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "rgb(200,240,255)" }}>
                                        {post.title}
                                    </span>
                                    <span style={{ fontSize: "0.78rem", color: "rgb(80,110,140)" }}>
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem", color: "rgb(80,110,140)" }}>
                                    <span>{post.user?.username || "Аноним"}</span>
                                    {post.category && <span>{post.category.emoji} {post.category.name}</span>}
                                    <span style={{ marginLeft: "auto" }}>👁 {post.views ?? 0} ⭐ {post.rating ?? 0}</span>
                                </div>
                                <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "rgb(120,155,190)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                    {stripTags(post.content)}
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