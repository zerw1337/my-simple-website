import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProfile, getPostsByUserPaginated, getCommentsByUserIdPaginated } from "../api/Posts";
import { createChat } from "../api/Messanger.js";
import { AuthContext } from "../context/AuthContext";
import { useOnlineStatus, formatLastSeen } from "../context/OnlineStatusContext.jsx";
import UserAvatar from "../components/UserAvatar";
import { stripTags } from "../components/PostContent";

const PAGE_SIZE = 10;

const C = {
    card: { background: "#161b24", border: "1px solid rgba(100,160,220,0.12)", borderRadius: "14px", padding: "1.75rem 2rem", marginBottom: "1.25rem", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" },
    label: { fontSize: "0.75rem", color: "rgb(80,110,140)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" },
    value: { color: "rgb(200,230,255)", fontWeight: 600, fontSize: "0.95rem" },
};

function Profile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { seedLastSeen, isOnline } = useOnlineStatus();

    const [profile, setProfile]         = useState(null);
    const [loading, setLoading]         = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [myUserId, setMyUserId]       = useState(null);
    const [activeTab, setActiveTab]     = useState("posts");

    // --- Посты ---
    const [posts, setPosts]               = useState([]);
    const [postsHasMore, setPostsHasMore] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);
    const postsOffsetRef   = useRef(0);
    const postsHasMoreRef  = useRef(true);
    const postsLoadingRef  = useRef(false);
    const postsObserverRef = useRef(null);

    // --- Комментарии ---
    const [comments, setComments]               = useState([]);
    const [commentsHasMore, setCommentsHasMore] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const commentsOffsetRef   = useRef(0);
    const commentsHasMoreRef  = useRef(true);
    const commentsLoadingRef  = useRef(false);
    const commentsObserverRef = useRef(null);

    const userId = parseInt(id);

    // ── подгрузка постов ─────────────────────────────────────────
    const loadMorePosts = useCallback(async () => {
        if (postsLoadingRef.current || !postsHasMoreRef.current) return;
        postsLoadingRef.current = true;
        setPostsLoading(true);

        const next = await getPostsByUserPaginated(userId, postsOffsetRef.current, PAGE_SIZE);
        postsOffsetRef.current += next.length;
        const more = next.length === PAGE_SIZE;
        postsHasMoreRef.current = more;

        setPosts(prev => [...prev, ...next]);
        setPostsHasMore(more);
        postsLoadingRef.current = false;
        setPostsLoading(false);
    }, [userId]);

    // ── подгрузка комментариев ───────────────────────────────────
    const loadMoreComments = useCallback(async () => {
        if (commentsLoadingRef.current || !commentsHasMoreRef.current) return;
        commentsLoadingRef.current = true;
        setCommentsLoading(true);

        const next = await getCommentsByUserIdPaginated(userId, commentsOffsetRef.current, PAGE_SIZE);
        commentsOffsetRef.current += next.length;
        const more = next.length === PAGE_SIZE;
        commentsHasMoreRef.current = more;

        setComments(prev => [...prev, ...next]);
        setCommentsHasMore(more);
        commentsLoadingRef.current = false;
        setCommentsLoading(false);
    }, [userId]);

    // ── callback ref для sentinel постов ─────────────────────────
    const postsSentinelRef = useCallback((node) => {
        if (postsObserverRef.current) { postsObserverRef.current.disconnect(); postsObserverRef.current = null; }
        if (!node) return;
        postsObserverRef.current = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) loadMorePosts(); },
            { rootMargin: "300px" }
        );
        postsObserverRef.current.observe(node);
    }, [loadMorePosts]);

    // ── callback ref для sentinel комментариев ───────────────────
    const commentsSentinelRef = useCallback((node) => {
        if (commentsObserverRef.current) { commentsObserverRef.current.disconnect(); commentsObserverRef.current = null; }
        if (!node) return;
        commentsObserverRef.current = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) loadMoreComments(); },
            { rootMargin: "300px" }
        );
        commentsObserverRef.current.observe(node);
    }, [loadMoreComments]);

    // ── первичная загрузка ───────────────────────────────────────
    useEffect(() => {
        setPosts([]); postsOffsetRef.current = 0; postsHasMoreRef.current = true; postsLoadingRef.current = false; setPostsHasMore(true);
        setComments([]); commentsOffsetRef.current = 0; commentsHasMoreRef.current = true; commentsLoadingRef.current = false; setCommentsHasMore(true);
        setActiveTab("posts");
        setLoading(true);

        const token = localStorage.getItem("access_token");
        let tokenUserId = null;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                tokenUserId = parseInt(payload.sub);
                setMyUserId(tokenUserId);
                if (tokenUserId === userId && !payload.is_verified) {
                    navigate("/register", { state: { step: 2 } }); return;
                }
            } catch {}
        }

        getProfile(id).then(data => {
            if (!data) {
                if (tokenUserId === userId) { navigate("/register", { state: { step: 3 } }); return; }
                setLoading(false); return;
            }
            setProfile(data); setLoading(false);
            if (data.last_seen) seedLastSeen(userId, data.last_seen);
        });

        // первая страница постов
        getPostsByUserPaginated(userId, 0, PAGE_SIZE).then(first => {
            setPosts(first);
            postsOffsetRef.current = first.length;
            const more = first.length === PAGE_SIZE;
            postsHasMoreRef.current = more;
            setPostsHasMore(more);
            postsLoadingRef.current = false;
        });
    }, [id]);

    // ── переключение таба ────────────────────────────────────────
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // при первом открытии таба комментариев — грузим первую страницу
        if (tab === "comments" && comments.length === 0 && commentsHasMoreRef.current && !commentsLoadingRef.current) {
            commentsLoadingRef.current = true;
            setCommentsLoading(true);
            getCommentsByUserIdPaginated(userId, 0, PAGE_SIZE).then(first => {
                setComments(first);
                commentsOffsetRef.current = first.length;
                const more = first.length === PAGE_SIZE;
                commentsHasMoreRef.current = more;
                setCommentsHasMore(more);
                commentsLoadingRef.current = false;
                setCommentsLoading(false);
            });
        }
    };

    if (loading) return (
        <main>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <div style={{ width: 44, height: 44, border: "3px solid rgba(100,160,220,0.15)", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        </main>
    );

    if (!profile) return (
        <main><p style={{ textAlign: "center", marginTop: "5rem", color: "rgb(80,110,140)" }}>Профиль не найден</p></main>
    );

    const isOwn = myUserId === userId;

    return (
        <main style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                {/* Шапка */}
                <div style={{ ...C.card, borderLeft: "3px solid rgba(4,198,233,0.4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <UserAvatar userId={userId} username={profile.username} size={128} />
                            <div>
                                <h2 style={{ margin: 0, fontSize: "1.6rem", color: "rgb(180,255,255)", lineHeight: 1.1 }}>{profile.username}</h2>
                                <p style={{ margin: 0, color: "rgb(80,110,140)", fontSize: "0.85rem" }}>{profile.first_name} {profile.last_name}</p>
                                <span style={{ fontSize: "0.78rem", color: isOnline(userId) ? "#22c55e" : "rgb(80,110,140)" }}>
                                    {isOnline(userId) ? "В сети" : profile.last_seen ? `Был(а) ${formatLastSeen(profile.last_seen)}` : "Не в сети"}
                                </span>
                            </div>
                        </div>

                        {!isOwn && user && (
                            <button disabled={chatLoading}
                                    onClick={async () => {
                                        setChatLoading(true);
                                        try { const c = await createChat(userId); setChatLoading(false); navigate("/messages", { state: { openChatUuid: c.chat_uuid } }); }
                                        catch { setChatLoading(false); navigate("/messages"); }
                                    }}
                                    style={{ padding: "0.4rem 1.1rem", background: "var(--logo-color)", border: "none", borderRadius: "8px", color: "#0a0f18", fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem", cursor: chatLoading ? "not-allowed" : "pointer", opacity: chatLoading ? 0.6 : 1 }}
                                    onMouseEnter={e => { if (!chatLoading) e.currentTarget.style.background = "rgb(3,220,255)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "var(--logo-color)"; }}>
                                {chatLoading ? "…" : "✉ Написать"}
                            </button>
                        )}
                        {isOwn && (
                            <button onClick={() => navigate("/settings")}
                                    style={{ padding: "0.4rem 1.1rem", background: "transparent", border: "1px solid rgba(4,198,233,0.3)", borderRadius: "8px", color: "var(--logo-color)", fontFamily: "inherit", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(4,198,233,0.08)"; e.currentTarget.style.borderColor = "var(--logo-color)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(4,198,233,0.3)"; }}>
                                ⚙ Настройки
                            </button>
                        )}
                    </div>

                    <div style={{ height: 1, background: "rgba(100,160,220,0.08)", margin: "1.25rem 0" }} />

                    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                        {profile.birthday && (
                            <div>
                                <div style={C.label}>Дата рождения</div>
                                <div style={C.value}>{new Date(profile.birthday).toLocaleDateString("ru-RU")}</div>
                            </div>
                        )}
                        <div>
                            <div style={C.label}>Постов</div>
                            <div style={C.value}>{posts.length}{postsHasMore ? "+" : ""}</div>
                        </div>
                        <div>
                            <div style={C.label}>Комментариев</div>
                            <div style={C.value}>{comments.length}{commentsHasMore ? "+" : ""}</div>
                        </div>
                    </div>

                    {profile.bio && (
                        <div style={{ marginTop: "1.25rem" }}>
                            <div style={C.label}>О себе</div>
                            <p style={{ margin: "0.25rem 0 0", color: "rgb(160,195,230)", fontSize: "0.95rem", lineHeight: 1.7 }}>{profile.bio}</p>
                        </div>
                    )}
                </div>

                {/* Табы */}
                <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", borderBottom: "1px solid rgba(100,160,220,0.1)" }}>
                    {[
                        { key: "posts",    label: `Посты (${posts.length}${postsHasMore ? "+" : ""})` },
                        { key: "comments", label: `Комментарии (${comments.length}${commentsHasMore ? "+" : ""})` },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => handleTabChange(tab.key)} style={{
                            padding: "0.6rem 1.25rem", background: "transparent", border: "none",
                            borderBottom: activeTab === tab.key ? "2px solid var(--logo-color)" : "2px solid transparent",
                            color: activeTab === tab.key ? "rgb(180,255,255)" : "rgb(80,110,140)",
                            fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", marginBottom: "-1px",
                        }}>{tab.label}</button>
                    ))}
                </div>

                {/* Посты */}
                {activeTab === "posts" && (
                    <div>
                        {postsLoading && posts.length === 0 ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "2rem 0" }}>
                                <div style={{ width: 36, height: 36, border: "3px solid rgba(100,160,220,0.15)", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            </div>
                        ) : posts.length === 0 ? (
                            <p style={{ color: "rgb(80,110,140)", textAlign: "center", padding: "2rem 0" }}>Постов пока нет</p>
                        ) : (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {posts.map(post => (
                                        <a key={post.id} href={"/posts/" + post.id} style={{ textDecoration: "none" }}>
                                            <div style={{ background: "#161b24", border: "1px solid rgba(100,160,220,0.1)", borderRadius: "10px", padding: "1rem 1.25rem", transition: "all 0.2s" }}
                                                 onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(180,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                                 onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,160,220,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                                                    <span style={{ fontWeight: 700, color: "rgb(200,230,255)", fontSize: "0.95rem" }}>{post.category?.emoji} {post.title}</span>
                                                    <span style={{ fontSize: "0.75rem", color: "rgb(60,90,120)" }}>{new Date(post.created_at).toLocaleDateString("ru-RU")}</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: "0.825rem", color: "rgb(100,130,160)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
                                                    {stripTags(post.content)}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>

                                {postsHasMore && <div ref={postsSentinelRef} style={{ height: "1px" }} />}

                                {postsLoading && (
                                    <div style={{ display: "flex", justifyContent: "center", padding: "1.25rem 0" }}>
                                        <div style={{ width: 28, height: 28, border: "3px solid rgba(100,160,220,0.15)", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Комментарии */}
                {activeTab === "comments" && (
                    <div>
                        {commentsLoading && comments.length === 0 ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "2rem 0" }}>
                                <div style={{ width: 36, height: 36, border: "3px solid rgba(100,160,220,0.15)", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            </div>
                        ) : comments.length === 0 ? (
                            <p style={{ color: "rgb(80,110,140)", textAlign: "center", padding: "2rem 0" }}>Комментариев пока нет</p>
                        ) : (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {comments.map(comment => (
                                        <div key={comment.id} style={{ background: "#161b24", border: "1px solid rgba(100,160,220,0.1)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                <a href={"/posts/" + comment.post_id} style={{ color: "var(--logo-color)", fontWeight: 600, fontSize: "0.825rem", textDecoration: "none" }}
                                                   onMouseEnter={e => e.currentTarget.style.color = "rgb(180,255,255)"}
                                                   onMouseLeave={e => e.currentTarget.style.color = "var(--logo-color)"}>
                                                    К посту →
                                                </a>
                                                <span style={{ fontSize: "0.75rem", color: "rgb(60,90,120)" }}>{new Date(comment.created_at).toLocaleString("ru-RU")}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: "0.9rem", color: "rgb(160,195,230)", lineHeight: 1.6 }}>{comment.content}</p>
                                        </div>
                                    ))}
                                </div>

                                {commentsHasMore && <div ref={commentsSentinelRef} style={{ height: "1px" }} />}

                                {commentsLoading && (
                                    <div style={{ display: "flex", justifyContent: "center", padding: "1.25rem 0" }}>
                                        <div style={{ width: 28, height: 28, border: "3px solid rgba(100,160,220,0.15)", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default Profile;
