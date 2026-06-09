import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCachedAvatarUrl, peekAvatarUrl } from "../api/avatarCache.js";

/**
 * Универсальный компонент аватара.
 *
 * Props:
 *   userId    — id пользователя
 *   username  — для буквы-заглушки
 *   size      — размер в px (default 40)
 *   style     — дополнительные inline-стили
 *   profileId — если передан, весь аватар оборачивается в <Link to="/profile/{profileId}">
 */
function UserAvatar({ userId, username, size = 40, style = {}, profileId }) {
    // Инициализируем state СИНХРОННО из кеша — устраняет моргание при ре-рендере списка.
    // peekAvatarUrl возвращает undefined если ещё не загружено, null если аватарки нет,
    // или строку-URL если уже есть.
    const [avatarUrl, setAvatarUrl] = useState(() => {
        const peeked = peekAvatarUrl(userId);
        return peeked !== undefined ? peeked : null;
    });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!userId) return;

        // Синхронная проверка: если уже в кеше — обновляем без async-тика
        const peeked = peekAvatarUrl(userId);
        if (peeked !== undefined) {
            setAvatarUrl(peeked);
            return;
        }

        // Иначе — async-загрузка (первый раз для этого userId)
        let cancelled = false;
        getCachedAvatarUrl(userId).then(url => {
            if (!cancelled) {
                setAvatarUrl(url);
                setLoaded(false);
            }
        });
        return () => { cancelled = true; };
    }, [userId]);

    const letter = username ? username[0].toUpperCase() : "?";

    const baseStyle = {
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(4,198,233,0.1)",
        border: "1px solid rgba(4,198,233,0.25)",
        color: "var(--logo-color)",
        fontSize: size * 0.4,
        fontWeight: 700,
        textDecoration: "none",
        ...style,
    };

    const inner = (
        <>
            {avatarUrl && (
                <img
                    src={avatarUrl}
                    alt={username || "avatar"}
                    onLoad={() => setLoaded(true)}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: loaded ? "block" : "none",
                        borderRadius: "50%",
                    }}
                />
            )}
            {(!avatarUrl || !loaded) && <span>{letter}</span>}
        </>
    );

    if (profileId) {
        return (
            <Link
                to={`/profile/${profileId}`}
                style={baseStyle}
                title={username ? `Профиль: ${username}` : undefined}
                onClick={e => e.stopPropagation()}
            >
                {inner}
            </Link>
        );
    }

    return <div style={baseStyle}>{inner}</div>;
}

export default UserAvatar;