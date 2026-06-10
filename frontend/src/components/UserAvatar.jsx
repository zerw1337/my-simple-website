import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { getCachedAvatarUrl, peekAvatarUrl } from "../api/avatarCache.js";
import { OnlineStatusContext } from "../context/OnlineStatusContext.jsx";

/**
 * Универсальный компонент аватара с индикатором онлайн-статуса.
 *
 * Props:
 *   userId    — id пользователя
 *   username  — для буквы-заглушки
 *   size      — размер в px (default 40)
 *   style     — дополнительные inline-стили
 *   profileId — если передан, оборачивается в <Link to="/profile/{profileId}">
 *   showStatus — показывать ли точку онлайн-статуса (default true)
 */
function UserAvatar({ userId, username, size = 40, style = {}, profileId, showStatus = true }) {
    const { isOnline, getLastSeen } = useContext(OnlineStatusContext);

    const [avatarUrl, setAvatarUrl] = useState(() => {
        const peeked = peekAvatarUrl(userId);
        return peeked !== undefined ? peeked : null;
    });
    const [loaded, setLoaded] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const peeked = peekAvatarUrl(userId);
        if (peeked !== undefined) { setAvatarUrl(peeked); return; }
        let cancelled = false;
        getCachedAvatarUrl(userId).then(url => {
            if (!cancelled) { setAvatarUrl(url); setLoaded(false); }
        });
        return () => { cancelled = true; };
    }, [userId]);

    const letter = username ? username[0].toUpperCase() : "?";
    const online = userId ? isOnline(userId) : false;
    const lastSeen = userId ? getLastSeen(userId) : null;
    const showDot = showStatus && userId && (online || lastSeen !== null);

    const dotSize = Math.max(8, Math.round(size * 0.28));
    const dotOffset = Math.round(dotSize * 0.1);

    // position:relative прямо на аватаре — не добавляем лишний враппер
    const baseStyle = {
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        position: "relative",           // ← для абсолютной точки
        overflow: "visible",            // ← чтобы точка не срезалась
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(4,198,233,0.1)",
        border: "1px solid rgba(4,198,233,0.25)",
        color: "var(--logo-color)",
        fontSize: size * 0.4,
        fontWeight: 700,
        textDecoration: "none",
        boxSizing: "border-box",
        ...style,
    };

    const dotStyle = {
        position: "absolute",
        bottom: -dotOffset,
        right: -dotOffset,
        width: dotSize,
        height: dotSize,
        borderRadius: "50%",
        background: online ? "#22c55e" : "#6b7280",
        border: `${Math.max(1, Math.round(dotSize * 0.22))}px solid #0d1117`,
        boxSizing: "border-box",
        zIndex: 2,
        pointerEvents: "none",         // не перехватываем клики
        transition: "background 0.3s",
    };

    const tooltipStyle = {
        position: "absolute",
        bottom: "calc(100% + 6px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1e2533",
        border: "1px solid rgba(100,160,220,0.2)",
        borderRadius: "6px",
        padding: "3px 8px",
        fontSize: "0.72rem",
        color: online ? "#22c55e" : "rgb(140,170,200)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
    };

    const imgStyle = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: loaded ? "block" : "none",
        borderRadius: "50%",
    };

    const inner = (
        <>
            {/* Скругление картинки — через вложенный div с overflow:hidden */}
            <div style={{
                position: "absolute", inset: 0,
                borderRadius: "50%", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(4,198,233,0.1)",
            }}>
                {avatarUrl && (
                    <img
                        src={avatarUrl}
                        alt={username || "avatar"}
                        onLoad={() => setLoaded(true)}
                        style={imgStyle}
                    />
                )}
                {(!avatarUrl || !loaded) && <span>{letter}</span>}
            </div>

            {/* Точка статуса */}
            {showDot && <span style={dotStyle} />}

            {/* Тултип (только при наведении) */}
            {showDot && showTooltip && (
                <div style={tooltipStyle}>
                    {online ? "В сети" : lastSeen ? `Был(а) ${lastSeen}` : null}
                </div>
            )}
        </>
    );

    if (profileId) {
        return (
            <Link
                to={`/profile/${profileId}`}
                style={baseStyle}
                title={username ? `Профиль: ${username}` : undefined}
                onClick={e => e.stopPropagation()}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {inner}
            </Link>
        );
    }

    return (
        <div
            style={baseStyle}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {inner}
        </div>
    );
}

export default UserAvatar;