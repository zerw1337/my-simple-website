import React, { useState, useEffect, useContext } from "react";
import { getReactionsByPostId, getReactionTypes, postReaction } from "../api/Posts";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function PostReactions({ postId }) {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [reactionTypes, setReactionTypes] = useState({});
    const [reactions, setReactions] = useState([]);
    const [userReaction, setUserReaction] = useState(null);
    const [loading, setLoading] = useState(false);

    const getIsVerified = () => {
        const token = localStorage.getItem("access_token");
        if (!token) return false;
        try { return JSON.parse(atob(token.split(".")[1])).is_verified === true; } catch { return false; }
    };

    useEffect(() => {
        getReactionTypes().then(data => {
            if (data && typeof data === "object") setReactionTypes(data);
        });
        fetchReactions();
    }, [postId]);

    const fetchReactions = async () => {
        const data = await getReactionsByPostId(postId);
        setReactions(data);
    };

    // Определяем реакцию текущего пользователя по user_id из токена
    useEffect(() => {
        if (!user || reactions.length === 0) {
            setUserReaction(null);
            return;
        }
        // user_id хранится в JWT — достанем из payload
        const token = localStorage.getItem("access_token");
        if (!token) return;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const myId = payload.sub ? parseInt(payload.sub) : null;
            const mine = reactions.find(r => r.user_id === myId);
            setUserReaction(mine ? mine.reaction.toUpperCase() : null);
        } catch {
            setUserReaction(null);
        }
    }, [reactions, user]);

    const getCounts = () => {
        const counts = {};
        for (const key of Object.keys(reactionTypes)) counts[key] = 0;
        for (const r of reactions) {
            const key = r.reaction.toUpperCase();
            counts[key] = (counts[key] || 0) + 1;
        }
        return counts;
    };

    const handleReaction = async (key) => {
        if (!user) return;
        if (!getIsVerified()) { navigate("/register", { state: { step: 2 } }); return; }
        if (loading) return;
        setLoading(true);
        try {
            await postReaction(postId, key.toLowerCase());
            await fetchReactions();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const counts = getCounts();

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" }}>
            {Object.entries(reactionTypes).map(([key, emoji]) => {
                const isActive = userReaction === key;
                return (
                    <button
                        key={key}
                        onClick={() => handleReaction(key)}
                        title={user ? (isActive ? "Убрать реакцию" : key) : "Войдите, чтобы реагировать"}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.3rem 0.75rem",
                            background: isActive ? "rgba(4, 198, 233, 0.15)" : "#2a2a2a",
                            border: `1px solid ${isActive ? "rgb(4, 198, 233)" : "#444"}`,
                            borderRadius: "999px",
                            color: "#ececec",
                            fontSize: "1rem",
                            cursor: user ? "pointer" : "default",
                            transition: "all 0.2s",
                            opacity: loading ? 0.6 : 1,
                        }}
                        onMouseEnter={e => { if (user && !isActive) e.currentTarget.style.borderColor = "rgb(4, 198, 233)"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = "#444"; }}
                    >
                        <span>{emoji}</span>
                        <span style={{ fontSize: "0.85rem", color: isActive ? "rgb(4, 198, 233)" : "#a0a0a0" }}>
                            {counts[key]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export default PostReactions;