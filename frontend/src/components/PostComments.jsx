import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { getCommentsByPostIdPaginated, createComment, deleteComment } from "../api/Posts";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";

const PAGE_SIZE = 10;

function PostComments({ postId }) {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [comments, setComments]     = useState([]);
    const [hasMore, setHasMore]       = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initLoading, setInitLoading] = useState(true);

    const [text, setText]         = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [myUserId, setMyUserId] = useState(null);
    const [isSuperuser, setIsSuperuser] = useState(false);

    const offsetRef   = useRef(0);
    const hasMoreRef  = useRef(true);
    const loadingRef  = useRef(false);
    const observerRef = useRef(null);

    const getIsVerified = () => {
        const token = localStorage.getItem("access_token");
        if (!token) return false;
        try { return JSON.parse(atob(token.split(".")[1])).is_verified === true; } catch { return false; }
    };

    // ── первичная загрузка ───────────────────────────────────────
    useEffect(() => {
        offsetRef.current  = 0;
        hasMoreRef.current = true;
        loadingRef.current = false;
        setComments([]);
        setHasMore(true);
        setInitLoading(true);

        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                const p = JSON.parse(atob(token.split(".")[1]));
                setMyUserId(parseInt(p.sub));
                setIsSuperuser(p.is_superuser === true);
            } catch {}
        }

        getCommentsByPostIdPaginated(postId, 0, PAGE_SIZE).then(data => {
            setComments(data);
            offsetRef.current = data.length;
            const more = data.length === PAGE_SIZE;
            hasMoreRef.current = more;
            setHasMore(more);
            setInitLoading(false);
        });
    }, [postId]);

    // ── подгрузка ────────────────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMoreRef.current) return;
        loadingRef.current = true;
        setLoadingMore(true);

        const next = await getCommentsByPostIdPaginated(postId, offsetRef.current, PAGE_SIZE);
        offsetRef.current += next.length;
        const more = next.length === PAGE_SIZE;
        hasMoreRef.current = more;

        setComments(prev => [...prev, ...next]);
        setHasMore(more);
        loadingRef.current = false;
        setLoadingMore(false);
    }, [postId]);

    // ── callback ref для sentinel ─────────────────────────────────
    const sentinelRef = useCallback((node) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        if (!node) return;
        observerRef.current = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) loadMore(); },
            { rootMargin: "300px" }
        );
        observerRef.current.observe(node);
    }, [loadMore]);

    // ── отправка комментария ─────────────────────────────────────
    const handleSubmit = async () => {
        if (!text.trim() || text.trim().length < 3 || text.trim().length > 255 || submitting) return;
        if (!getIsVerified()) { navigate("/register", { state: { step: 2 } }); return; }
        setSubmitting(true);
        try {
            await createComment(postId, text.trim());
            setText("");
            // Перезагружаем с нуля чтобы новый коммент был виден
            offsetRef.current  = 0;
            hasMoreRef.current = true;
            loadingRef.current = false;
            const fresh = await getCommentsByPostIdPaginated(postId, 0, PAGE_SIZE);
            setComments(fresh);
            offsetRef.current = fresh.length;
            const more = fresh.length === PAGE_SIZE;
            hasMoreRef.current = more;
            setHasMore(more);
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (commentId) => {
        try {
            await deleteComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (e) { console.error(e); }
    };

    const displayed = comments.length + (hasMore ? "+" : "");

    return (
        <div style={{ marginTop: "2rem" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <h3 style={{ marginBottom: "1rem" }}>Комментарии ({displayed})</h3>
            <hr style={{ borderColor: "#333", marginBottom: "1.5rem" }} />

            {user && (
                <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Напишите комментарий..."
                        rows={3}
                        style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#2a2a2a", border: "1px solid #444", borderRadius: "8px", color: "var(--main-text-color)", fontSize: "1rem", resize: "vertical", outline: "none", fontFamily: "'Poppins', sans-serif", boxSizing: "border-box", transition: "border-color 0.2s" }}
                        onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                        onBlur={e => e.target.style.borderColor = "#444"}
                    />
                    <span style={{ fontSize: "0.8rem", color: text.length > 255 ? "#ff5555" : text.length > 0 && text.trim().length < 3 ? "#ff5555" : "#a0a0a0", alignSelf: "flex-end" }}>
                        {text.length}/255
                    </span>
                    <button onClick={handleSubmit}
                            disabled={submitting || text.trim().length < 3 || text.trim().length > 255}
                            style={{ alignSelf: "flex-end", padding: "0.4rem 1.2rem", background: "var(--logo-color)", color: "var(--bg-main)", border: "none", borderRadius: "6px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, cursor: submitting || !text.trim() ? "default" : "pointer", opacity: submitting || !text.trim() ? 0.6 : 1, transition: "background 0.2s" }}
                            onMouseEnter={e => { if (!submitting && text.trim()) e.currentTarget.style.background = "#03b0d0"; }}
                            onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}>
                        {submitting ? "…" : "Отправить"}
                    </button>
                </div>
            )}

            {initLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "2rem 0" }}>
                    <div style={{ width: 32, height: 32, border: "3px solid #333", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
            ) : comments.length === 0 ? (
                <p style={{ color: "#a0a0a0" }}>Комментариев пока нет.</p>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {comments.map(comment => (
                            <div key={comment.id} style={{ background: "#2a2a2a", border: "1px solid #333", borderRadius: "8px", padding: "0.75rem 1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                        <UserAvatar userId={comment.user_id} username={comment.user?.username || comment.username} size={30} />
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                            {comment.user_id
                                                ? <a href={"/profile/" + comment.user_id} style={{ color: "var(--logo-color)", textDecoration: "none" }}
                                                     onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                                                     onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                                                    {comment.user?.username || comment.username || "Аноним"}
                                                </a>
                                                : (comment.user?.username || comment.username || "Аноним")}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <span style={{ fontSize: "0.8rem", color: "#a0a0a0" }}>{new Date(comment.created_at).toLocaleString()}</span>
                                        {(myUserId === comment.user_id || isSuperuser) && (
                                            <button onClick={() => handleDelete(comment.id)}
                                                    style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "0.8rem", padding: 0, transition: "color 0.2s" }}
                                                    onMouseEnter={e => e.currentTarget.style.color = "#ff5555"}
                                                    onMouseLeave={e => e.currentTarget.style.color = "#666"}>
                                                удалить
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>{comment.content}</p>
                            </div>
                        ))}
                    </div>

                    {hasMore && <div ref={sentinelRef} style={{ height: "1px", marginTop: "0.5rem" }} />}

                    {loadingMore && (
                        <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
                            <div style={{ width: 28, height: 28, border: "3px solid #333", borderTop: "3px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default PostComments;
