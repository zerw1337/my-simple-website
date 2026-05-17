import React, { useState, useEffect } from "react";
import { getAvatarUrl } from "../api/Posts";

// Универсальный компонент аватара
// userId — id пользователя
// username — для буквы-заглушки
// size — размер в px (default 40)
// style — доп. стили
function UserAvatar({ userId, username, size = 40, style = {} }) {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!userId) return;
        let objectUrl = null;
        getAvatarUrl(userId).then(url => {
            objectUrl = url;
            setAvatarUrl(url);
        });
        // Освобождаем blob URL при размонтировании
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
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
        ...style,
    };

    return (
        <div style={baseStyle}>
            {avatarUrl ? (
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
            ) : null}
            {/* Заглушка — буква. Скрывается когда картинка загружена */}
            {(!avatarUrl || !loaded) && <span>{letter}</span>}
        </div>
    );
}

export default UserAvatar;
