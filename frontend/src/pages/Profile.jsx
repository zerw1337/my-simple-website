import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProfile, getCommentsByUserId, getPostsByUserId } from "../api/Posts";
import { AuthContext } from "../context/AuthContext";
import UserAvatar from "../components/UserAvatar";

const C = {
    card: {
        background: "#161b24",
        border: "1px solid rgba(100,160,220,0.12)",
        borderRadius: "14px",
        padding: "1.75rem 2rem",
        marginBottom: "1.25rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    },
    label: { fontSize: "0.75rem", color: "rgb(80,110,140)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" },
    value: { color: "rgb(200,230,255)", fontWeight: 600, fontSize: "0.95rem" },
    expandBtn: {
        width: "100%", marginTop: "0.75rem", padding: "0.5rem",
        background: "transparent", border: "1px solid rgba(100,160,220,0.15)",
        borderRadius: "8px", color: "rgb(80,110,140)", fontFamily: "inherit",
        cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s",
    },
};

function Profile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [comments, setComments] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myUserId, setMyUserId] = useState(null);
    const [showAllPosts, setShowAllPosts] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);
    const [activeTab, setActiveTab] = useState("posts");

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        let tokenUserId = null;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                tokenUserId = parseInt(payload.sub);
                setMyUserId(tokenUserId);
                if (tokenUserId === parseInt(id) && !payload.is_verified) {
                    navigate("/register", { state: { step: 2 } });
                    return;
                }
            } catch {}
        }
        getProfile(id).then(data => {
            if (!data) {
                if (tokenUserId === parseInt(id)) { navigate("/register", { state: { step: 3 } }); return; }
                setLoading(false); return;
            }
            setProfile(data); setLoading(false);
        });
        getCommentsByUserId(id).then(setComments);
        getPostsByUserId(id).then(setPosts);
    }, [id]);

    if (loading) return (
        <main>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <div style={{ width: "44px", height: "44px", border: "3px solid rgba(100,160,220,0.15)", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </main>
    );

    if (!profile) return (
        <main><p style={{ textAlign: "center", marginTop: "5rem", color: "rgb(80,110,140)" }}>Профиль не найден</p></main>
    );

    const isOwn = myUserId === parseInt(id);
    const visiblePosts = showAllPosts ? posts : posts.slice(0, 5);
    const visibleComments = showAllComments ? comments : comments.slice(0, 5);

    return (
        <main style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                {/* Шапка профиля */}
                <div style={{ ...C.card, borderLeft: "3px solid rgba(4,198,233,0.4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                                <UserAvatar userId={parseInt(id)} username={profile.username} size={128} />
                                <div>
                                    <h2 style={{ margin: 0, fontSize: "1.6rem", color: "rgb(180,255,255)", lineHeight: 1.1 }}>
                                        {profile.username}
                                    </h2>
                                    <p style={{ margin: 0, color: "rgb(80,110,140)", fontSize: "0.85rem" }}>
                                        {profile.first_name} {profile.last_name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {isOwn && (
                            <button onClick={() => navigate("/settings")} style={{
                                padding: "0.4rem 1.1rem",
                                background: "transparent",
                                border: "1px solid rgba(4,198,233,0.3)",
                                borderRadius: "8px",
                                color: "var(--logo-color)",
                                fontFamily: "inherit",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(4,198,233,0.08)"; e.currentTarget.style.borderColor = "var(--logo-color)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(4,198,233,0.3)"; }}>
                                ⚙ Настройки
                            </button>
                        )}
                    </div>

                    <div style={{ height: "1px", background: "rgba(100,160,220,0.08)", margin: "1.25rem 0" }} />

                    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                        {profile.birthday && (
                            <div>
                                <div style={C.label}>Дата рождения</div>
                                <div style={C.value}>{new Date(profile.birthday).toLocaleDateString("ru-RU")}</div>
                            </div>
                        )}
                        <div>
                            <div style={C.label}>Постов</div>
                            <div style={C.value}>{posts.length}</div>
                        </div>
                        <div>
                            <div style={C.label}>Комментариев</div>
                            <div style={C.value}>{comments.length}</div>
                        </div>
                    </div>

                    {profile.bio && (
                        <div style={{ marginTop: "1.25rem" }}>
                            <div style={C.label}>О себе</div>
                            <p style={{ margin: "0.25rem 0 0", color: "rgb(160,195,230)", fontSize: "0.95rem", lineHeight: 1.7 }}>
                                {profile.bio}
                            </p>
                        </div>
                    )}
                </div>

                {/* Табы */}
                <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", borderBottom: "1px solid rgba(100,160,220,0.1)", paddingBottom: "0" }}>
                    {[
                        { key: "posts", label: `Посты (${posts.length})` },
                        { key: "comments", label: `Комментарии (${comments.length})` },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                            padding: "0.6rem 1.25rem",
                            background: "transparent",
                            border: "none",
                            borderBottom: activeTab === tab.key ? "2px solid var(--logo-color)" : "2px solid transparent",
                            color: activeTab === tab.key ? "rgb(180,255,255)" : "rgb(80,110,140)",
                            fontFamily: "inherit",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            marginBottom: "-1px",
                        }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Посты */}
                {activeTab === "posts" && (
                    <div>
                        {posts.length === 0 ? (
                            <p style={{ color: "rgb(80,110,140)", textAlign: "center", padding: "2rem 0" }}>Постов пока нет</p>
                        ) : (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {visiblePosts.map(post => (
                                        <a key={post.id} href={"/posts/" + post.id} style={{ textDecoration: "none" }}>
                                            <div style={{
                                                background: "#161b24", border: "1px solid rgba(100,160,220,0.1)",
                                                borderRadius: "10px", padding: "1rem 1.25rem", transition: "all 0.2s",
                                            }}
                                                 onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(180,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                                 onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,160,220,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                                                    <span style={{ fontWeight: 700, color: "rgb(200,230,255)", fontSize: "0.95rem" }}>
                                                        {post.category?.emoji} {post.title}
                                                    </span>
                                                    <span style={{ fontSize: "0.75rem", color: "rgb(60,90,120)" }}>
                                                        {new Date(post.created_at).toLocaleDateString("ru-RU")}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: "0.825rem", color: "rgb(100,130,160)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {post.content}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                                {posts.length > 5 && (
                                    <button onClick={() => setShowAllPosts(!showAllPosts)} style={C.expandBtn}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(4,198,233,0.3)"; e.currentTarget.style.color = "var(--logo-color)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,160,220,0.15)"; e.currentTarget.style.color = "rgb(80,110,140)"; }}>
                                        {showAllPosts ? "Скрыть" : `Показать ещё ${posts.length - 5}`}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Комментарии */}
                {activeTab === "comments" && (
                    <div>
                        {comments.length === 0 ? (
                            <p style={{ color: "rgb(80,110,140)", textAlign: "center", padding: "2rem 0" }}>Комментариев пока нет</p>
                        ) : (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {visibleComments.map(comment => (
                                        <div key={comment.id} style={{
                                            background: "#161b24", border: "1px solid rgba(100,160,220,0.1)",
                                            borderRadius: "10px", padding: "1rem 1.25rem",
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                <a href={"/posts/" + comment.post_id} style={{ color: "var(--logo-color)", fontWeight: 600, fontSize: "0.825rem", textDecoration: "none" }}
                                                   onMouseEnter={e => e.currentTarget.style.color = "rgb(180,255,255)"}
                                                   onMouseLeave={e => e.currentTarget.style.color = "var(--logo-color)"}>
                                                    К посту →
                                                </a>
                                                <span style={{ fontSize: "0.75rem", color: "rgb(60,90,120)" }}>
                                                    {new Date(comment.created_at).toLocaleString("ru-RU")}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: "0.9rem", color: "rgb(160,195,230)", lineHeight: 1.6 }}>
                                                {comment.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {comments.length > 5 && (
                                    <button onClick={() => setShowAllComments(!showAllComments)} style={C.expandBtn}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(4,198,233,0.3)"; e.currentTarget.style.color = "var(--logo-color)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,160,220,0.15)"; e.currentTarget.style.color = "rgb(80,110,140)"; }}>
                                        {showAllComments ? "Скрыть" : `Показать ещё ${comments.length - 5}`}
                                    </button>
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
