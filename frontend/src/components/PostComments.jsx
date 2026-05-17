import React, { useState, useEffect, useContext } from "react";
import { getCommentsByPostId, createComment, deleteComment } from "../api/Posts";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";

function PostComments({ postId }) {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [myUserId, setMyUserId] = useState(null);
    const [isSuperuser, setIsSuperuser] = useState(false);

    const getIsVerified = () => {
        const token = localStorage.getItem("access_token");
        if (!token) return false;
        try { return JSON.parse(atob(token.split(".")[1])).is_verified === true; } catch { return false; }
    };

    useEffect(() => {
        fetchComments();
        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setMyUserId(parseInt(payload.sub));
                setIsSuperuser(payload.is_superuser === true);
            } catch {}
        }
    }, [postId]);

    const fetchComments = async () => {
        const data = await getCommentsByPostId(postId);
        setComments(data);
    };

    const handleSubmit = async () => {
        if (!text.trim() || text.trim().length < 3 || text.trim().length > 255 || loading) return;
        if (!getIsVerified()) { navigate("/register", { state: { step: 2 } }); return; }
        setLoading(true);
        try {
            await createComment(postId, text.trim());
            setText("");
            await fetchComments();
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (commentId) => {
        try { await deleteComment(commentId); await fetchComments(); }
        catch (e) { console.error(e); }
    };

    return (
        <div style={{ marginTop: "2rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Комментарии ({comments.length})</h3>
            <hr style={{ borderColor: "#333", marginBottom: "1.5rem" }} />

            {user && (
                <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Напишите комментарий..."
                        rows={3}
                        style={{
                            width: "100%", padding: "0.6rem 0.75rem",
                            background: "#2a2a2a", border: "1px solid #444",
                            borderRadius: "8px", color: "var(--main-text-color)",
                            fontSize: "1rem", resize: "vertical", outline: "none",
                            fontFamily: "'Poppins', sans-serif", boxSizing: "border-box", transition: "border-color 0.2s",
                        }}
                        onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                        onBlur={e => e.target.style.borderColor = "#444"}
                    />
                    <span style={{ fontSize: "0.8rem", color: text.length > 255 ? "#ff5555" : text.length > 0 && text.trim().length < 3 ? "#ff5555" : "#a0a0a0", alignSelf: "flex-end" }}>
                        {text.length}/255
                    </span>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || text.trim().length < 3 || text.trim().length > 255}
                        style={{
                            alignSelf: "flex-end", padding: "0.4rem 1.2rem",
                            background: "var(--logo-color)", color: "var(--bg-main)",
                            border: "none", borderRadius: "6px",
                            fontFamily: "'Poppins', sans-serif", fontWeight: 600,
                            cursor: loading || !text.trim() ? "default" : "pointer",
                            opacity: loading || !text.trim() ? 0.6 : 1, transition: "background 0.2s",
                        }}
                        onMouseEnter={e => { if (!loading && text.trim()) e.currentTarget.style.background = "#03b0d0"; }}
                        onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}
                    >
                        Отправить
                    </button>
                </div>
            )}

            {comments.length === 0 ? (
                <p style={{ color: "#a0a0a0" }}>Комментариев пока нет.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {comments.map(comment => (
                        <div key={comment.id} style={{
                            background: "#2a2a2a", border: "1px solid #333",
                            borderRadius: "8px", padding: "0.75rem 1rem",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <UserAvatar
                                        userId={comment.user_id}
                                        username={comment.user?.username || comment.username}
                                        size={30}
                                    />
                                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                        {comment.user_id
                                            ? <a href={"/profile/" + comment.user_id}
                                                 style={{ color: "var(--logo-color)", textDecoration: "none" }}
                                                 onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                                                 onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                                                {comment.user?.username || comment.username || "Аноним"}
                                            </a>
                                            : (comment.user?.username || comment.username || "Аноним")}
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{ fontSize: "0.8rem", color: "#a0a0a0" }}>
                                        {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                    {(myUserId === comment.user_id || isSuperuser) && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            style={{
                                                background: "none", border: "none", color: "#666",
                                                cursor: "pointer", fontSize: "0.8rem", padding: 0, transition: "color 0.2s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = "#ff5555"}
                                            onMouseLeave={e => e.currentTarget.style.color = "#666"}
                                        >
                                            удалить
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>
                                {comment.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PostComments;
