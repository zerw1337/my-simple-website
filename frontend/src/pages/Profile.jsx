import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProfile, getCommentsByUserId, getPostsByUserId } from "../api/Posts";
import { AuthContext } from "../context/AuthContext";

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

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        let tokenUserId = null;

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                tokenUserId = parseInt(payload.sub);
                setMyUserId(tokenUserId);

                if (tokenUserId === parseInt(id)) {
                    if (!payload.is_verified) {
                        navigate("/register", { state: { step: 2 } });
                        return;
                    }
                }
            } catch {}
        }

        getProfile(id).then(data => {
            if (!data) {
                if (tokenUserId === parseInt(id)) {
                    navigate("/register", { state: { step: 3 } });
                    return;
                }
                setLoading(false);
                return;
            }
            setProfile(data);
            setLoading(false);
        });

        getCommentsByUserId(id).then(setComments);
        getPostsByUserId(id).then(setPosts);
    }, [id]);

    const expandBtnStyle = {
        marginTop: "1rem",
        width: "100%",
        padding: "0.5rem",
        background: "transparent",
        border: "1px solid #444",
        borderRadius: "8px",
        color: "#a0a0a0",
        fontFamily: "'Poppins', sans-serif",
        cursor: "pointer",
        transition: "all 0.2s",
    };

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

    if (!profile) return (
        <main>
            <p style={{ textAlign: "center", marginTop: "4rem" }}>Профиль не найден</p>
        </main>
    );

    const isOwnProfile = myUserId === parseInt(id);
    const visiblePosts = showAllPosts ? posts : posts.slice(0, 5);
    const visibleComments = showAllComments ? comments : comments.slice(0, 5);

    return (
        <main>
            <div style={{ maxWidth: "800px", margin: "2rem auto" }}>

                <div style={{
                    background: "#1f1f1f",
                    borderRadius: "12px",
                    padding: "2rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    marginBottom: "2rem",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "2rem", color: "var(--logo-color)" }}>
                                {profile.username}
                            </h2>
                            <p style={{ margin: "0.25rem 0 0", color: "#a0a0a0", fontSize: "0.9rem" }}>
                                {profile.first_name} {profile.last_name}
                            </p>
                        </div>
                        {isOwnProfile && (
                            <button
                                onClick={() => navigate("/settings")}
                                style={{
                                    padding: "0.4rem 1rem",
                                    background: "transparent",
                                    border: "1px solid var(--logo-color)",
                                    borderRadius: "6px",
                                    color: "var(--logo-color)",
                                    fontFamily: "'Poppins', sans-serif",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = "var(--logo-color)";
                                    e.currentTarget.style.color = "var(--bg-main)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "var(--logo-color)";
                                }}
                            >
                                Настройки
                            </button>
                        )}
                    </div>

                    <hr style={{ borderColor: "#333", margin: "1.5rem 0" }} />

                    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", fontSize: "0.95rem" }}>
                        <div>
                            <span style={{ color: "#a0a0a0" }}>Дата рождения</span>
                            <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>
                                {new Date(profile.birthday).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {profile.bio && (
                        <div style={{ marginTop: "1.5rem" }}>
                            <span style={{ color: "#a0a0a0", fontSize: "0.9rem" }}>О себе</span>
                            <p style={{ margin: "0.25rem 0 0" }}>{profile.bio}</p>
                        </div>
                    )}
                </div>

                {posts.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                        <h3 style={{ marginBottom: "1rem" }}>Посты ({posts.length})</h3>
                        <hr style={{ borderColor: "#333", marginBottom: "1.5rem" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {visiblePosts.map(post => (
                                <a
                                    key={post.id}
                                    href={"/posts/" + post.id}
                                    style={{ textDecoration: "none" }}
                                >
                                    <div
                                        style={{
                                            background: "#2a2a2a",
                                            border: "1px solid #333",
                                            borderRadius: "8px",
                                            padding: "0.75rem 1rem",
                                            transition: "border-color 0.2s",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--logo-color)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#333"; }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontWeight: 600, color: "var(--main-text-color)" }}>
                                                {post.category?.emoji} {post.title}
                                            </span>
                                            <span style={{ fontSize: "0.8rem", color: "#a0a0a0" }}>
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{
                                            margin: "0.4rem 0 0",
                                            fontSize: "0.85rem",
                                            color: "#a0a0a0",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {post.content}
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>
                        {posts.length > 5 && (
                            <button
                                onClick={() => setShowAllPosts(!showAllPosts)}
                                style={expandBtnStyle}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "var(--logo-color)";
                                    e.currentTarget.style.color = "var(--logo-color)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "#444";
                                    e.currentTarget.style.color = "#a0a0a0";
                                }}
                            >
                                {showAllPosts ? "Скрыть" : "Показать ещё " + (posts.length - 5)}
                            </button>
                        )}
                    </div>
                )}

                <div>
                    <h3 style={{ marginBottom: "1rem" }}>Комментарии ({comments.length})</h3>
                    <hr style={{ borderColor: "#333", marginBottom: "1.5rem" }} />

                    {comments.length === 0 ? (
                        <p style={{ color: "#a0a0a0" }}>Комментариев пока нет.</p>
                    ) : (
                        <>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {visibleComments.map(comment => (
                                    <div
                                        key={comment.id}
                                        style={{
                                            background: "#2a2a2a",
                                            border: "1px solid #333",
                                            borderRadius: "8px",
                                            padding: "0.75rem 1rem",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                            <a
                                                href={"/posts/" + comment.post_id}
                                                style={{ color: "var(--logo-color)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
                                                onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
                                                onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}
                                            >
                                                Перейти к посту →
                                            </a>
                                            <span style={{ fontSize: "0.8rem", color: "#a0a0a0" }}>
                                                {new Date(comment.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>
                                            {comment.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {comments.length > 5 && (
                                <button
                                    onClick={() => setShowAllComments(!showAllComments)}
                                    style={expandBtnStyle}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "var(--logo-color)";
                                        e.currentTarget.style.color = "var(--logo-color)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "#444";
                                        e.currentTarget.style.color = "#a0a0a0";
                                    }}
                                >
                                    {showAllComments ? "Скрыть" : "Показать ещё " + (comments.length - 5)}
                                </button>
                            )}
                        </>
                    )}
                </div>

            </div>
        </main>
    );
}

export default Profile;
