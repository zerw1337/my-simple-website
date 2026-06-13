import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCategories, getPostsPaginated, getTopViewedPosts, getTopRatedPosts } from "../api/Posts";
import BlogMainImg from "../assets/images/blog-main-img.gif";
import { stripTags } from "../components/PostContent";

const PAGE_SIZE = 10;

const S = {
    card: {
        background: "#262626",
        border: "1px solid rgba(100,160,220,0.12)",
        borderRadius: "10px",
        padding: "1.4em",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    },
};

function Blog() {
    const navigate = useNavigate();
    const location = useLocation();
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(location.state?.categoryId ?? null);
    const [sort, setSort] = useState("default");

    // default — курсорная пагинация
    const [posts, setPosts] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // views / rating — грузятся целиком
    const [viewsPosts, setViewsPosts] = useState([]);
    const [ratingPosts, setRatingPosts] = useState([]);

    const [initLoading, setInitLoading] = useState(true);

    // sentinel для IntersectionObserver
    const sentinelRef = useRef(null);
    const observerRef = useRef(null);

    // ---------- первичная загрузка ----------
    useEffect(() => {
        // сбрасываем state из navigate, чтобы при F5 фильтр не залипал
        if (location.state?.categoryId) window.history.replaceState({}, "");
        setInitLoading(true);
        Promise.all([
            getCategories(),
            getPostsPaginated(null, PAGE_SIZE),
        ]).then(([cats, firstPage]) => {
            setCategories(cats);
            setPosts(firstPage);
            setCursor(firstPage.length ? firstPage[firstPage.length - 1].id : null);
            setHasMore(firstPage.length === PAGE_SIZE);
            setInitLoading(false);
        });
    }, []);

    // views / rating — лениво при первом переключении
    useEffect(() => {
        if (sort === "views"  && viewsPosts.length  === 0) getTopViewedPosts().then(setViewsPosts);
        if (sort === "rating" && ratingPosts.length === 0) getTopRatedPosts().then(setRatingPosts);
    }, [sort]);

    // ---------- подгрузка следующей страницы ----------
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || sort !== "default" || activeCategory) return;
        setLoadingMore(true);
        const next = await getPostsPaginated(cursor, PAGE_SIZE);
        setPosts(prev => [...prev, ...next]);
        setCursor(next.length ? next[next.length - 1].id : cursor);
        setHasMore(next.length === PAGE_SIZE);
        setLoadingMore(false);
    }, [cursor, hasMore, loadingMore, sort, activeCategory]);

    // ---------- IntersectionObserver ----------
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMore();
            },
            { rootMargin: "200px" }   // начинаем грузить за 200px до края
        );

        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

        return () => observerRef.current?.disconnect();
    }, [loadMore]);

    // ---------- смена сортировки / категории ----------
    const handleSortChange = (key) => { setSort(key); setActiveCategory(null); };

    const activePosts =
        sort === "views"  ? viewsPosts  :
            sort === "rating" ? ratingPosts :
                posts;

    const filteredPosts = activeCategory
        ? activePosts.filter(p => p.category?.id === activeCategory)
        : activePosts;

    const showSentinel = sort === "default" && !activeCategory && hasMore;

    if (initLoading) return (
        <main>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
                <div style={{ width: 48, height: 48, border: "4px solid #333", borderTop: "4px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        </main>
    );

    return (
        <main style={{ paddingTop: "3rem" }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .post-card:hover {
                    border-color: rgba(180,255,255,0.2) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(4,198,233,0.05) !important;
                }
            `}</style>

            <div style={{ maxWidth: "1200px", margin: "2rem auto" }}>

                {/* Hero */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", maxWidth: "1200px", margin: "0 auto 3rem auto", padding: "2rem 1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 400px", minWidth: "280px", textAlign: "left" }}>
                        <h2 style={{ fontSize: "2.8rem", fontWeight: "700", marginBottom: "0.8rem", color: "rgb(180, 255, 255)", textShadow: "0 0 6px rgba(180,255,255,0.5), 0 0 12px rgba(4,198,233,0.3)" }}>
                            БЛОГ
                        </h2>
                        <p style={{ fontSize: "1.15rem", color: "rgb(180, 220, 255)", lineHeight: "1.7", maxWidth: "500px" }}>
                            Пишу свои мысли о всём: кинематограф, игры, технологии и многое другое.
                        </p>
                    </div>
                    <div style={{ flex: "1 1 300px", minWidth: "280px" }}>
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
                        <button key={key} onClick={() => handleSortChange(key)}
                                style={{ padding: "0.3rem 0.9rem", borderRadius: "50px", border: "1px solid transparent", background: sort === key ? "linear-gradient(90deg, rgba(4,198,233,0.8), rgba(180,255,255,0.7))" : "rgba(255,255,255,0.05)", color: sort === key ? "#1f1f1f" : "#a0a0a0", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.25s ease", boxShadow: sort === key ? "0 4px 12px rgba(4,198,233,0.3)" : "none" }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Категории */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
                    <button onClick={() => setActiveCategory(null)}
                            style={{ padding: "0.3rem 0.9rem", borderRadius: "50px", border: "1px solid transparent", background: activeCategory === null ? "linear-gradient(90deg, rgba(4,198,233,0.8), rgba(180,255,255,0.7))" : "rgba(255,255,255,0.05)", color: activeCategory === null ? "#1f1f1f" : "#a0a0a0", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
                        {"Все (" + activePosts.length + (sort === "default" && hasMore ? "+" : "") + ")"}
                    </button>
                    {categories.map(cat => {
                        const isActive = activeCategory === cat.id;
                        const count = activePosts.filter(p => p.category?.id === cat.id).length;
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

                {/* Список постов */}
                {filteredPosts.length === 0 ? (
                    <p style={{ color: "rgb(100,130,160)", textAlign: "center", marginTop: "3rem" }}>Постов не найдено</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                        {filteredPosts.map(post => (
                            <div key={post.id} className="post-card" style={S.card} onClick={() => navigate("/posts/" + post.id)}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "rgb(200,240,255)" }}>{post.title}</span>
                                    <span style={{ fontSize: "0.78rem", color: "rgb(80,110,140)" }}>{new Date(post.created_at).toLocaleDateString()}</span>
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

                {/* Sentinel — триггер для подгрузки */}
                {showSentinel && (
                    <div ref={sentinelRef} style={{ height: 1 }} />
                )}

                {/* Спиннер пока грузится следующая страница */}
                {loadingMore && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 0" }}>
                        <div style={{ width: 32, height: 32, border: "3px solid #333", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </div>
                )}

                {/* Спиннер для views/rating пока грузятся */}
                {((sort === "views" && viewsPosts.length === 0) || (sort === "rating" && ratingPosts.length === 0)) && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
                        <div style={{ width: 36, height: 36, border: "3px solid #333", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </div>
                )}
            </div>
        </main>
    );
}

export default Blog;