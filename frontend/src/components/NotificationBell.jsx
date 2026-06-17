import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationsContext.jsx";

function timeAgo(dateStr) {
    if (!dateStr) return "";

    const date = new Date(dateStr);

    // фикс для naive UTC времени с бэка
    date.setHours(date.getHours() + 3);

    const diff = Date.now() - date.getTime();

    const m = Math.floor(diff / 60000);

    if (m < 1) return "только что";
    if (m < 60) return `${m} мин. назад`;

    const h = Math.floor(m / 60);

    if (h < 24) return `${h} ч. назад`;

    const d = Math.floor(h / 24);

    return `${d} д. назад`;
}

// refer_to может быть полным URL (https://zerw1337.ru/posts/1/)
// или относительным (/posts/1)
function toLocalPath(referTo) {
    if (!referTo) return null;

    try {
        return new URL(referTo).pathname;
    } catch {
        return referTo.startsWith("/")
            ? referTo
            : `/${referTo}`;
    }
}

// поддержка старого reffer_to и нового refer_to
function getReferTo(notification) {
    return (
        notification?.refer_to ||
        notification?.reffer_to ||
        null
    );
}

function NotificationBell({ onClose }) {
    const { notifications, markRead, markAllRead, deleteOne, deleteAll } = useNotifications();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const unreadCount = notifications.filter(
        (n) => n.status === "unread"
    ).length;

    useEffect(() => {
        if (!open) return;

        const handler = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);

        return () =>
            document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleOpen = () => {
        setOpen((o) => !o);

        if (onClose) {
            onClose();
        }
    };

    const handleReadAll = () => {
        setLoading(true);
        markAllRead();
        setLoading(false);
    };

    const handleDeleteAll = () => {
        setLoading(true);
        deleteAll();
        setLoading(false);
    };

    const handleNotifClick = (notif) => {
        if (notif.status === "unread") {
            markRead(notif.id);
        }

        const referTo = getReferTo(notif.notification);
        const path = toLocalPath(referTo);

        if (path) {
            setOpen(false);
            navigate(path);
        }
    };

    const handleDelete = (notif, e) => {
        e.stopPropagation();
        deleteOne(notif.id);
    };

    return (
        <div
            style={{ position: "relative" }}
            ref={dropdownRef}
        >
            <button
                onClick={handleOpen}
                aria-label="Уведомления"
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    color: open
                        ? "rgb(4,198,233)"
                        : "rgb(180,220,255)",
                    fontSize: "1.25rem",
                    transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                    if (!open) {
                        e.currentTarget.style.color =
                            "rgb(180,255,255)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!open) {
                        e.currentTarget.style.color =
                            "rgb(180,220,255)";
                    }
                }}
            >
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {unreadCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: "-4px",
                            right: "-4px",
                            background: "rgb(4,198,233)",
                            color: "#000",
                            borderRadius: "50%",
                            width: "16px",
                            height: "16px",
                            fontSize: "10px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                            fontFamily: "'Poppins', sans-serif",
                        }}
                    >
                        {unreadCount > 9
                            ? "9+"
                            : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 12px)",
                        right: 0,
                        width: "340px",
                        maxHeight: "480px",
                        background: "#161b24",
                        border:
                            "1px solid rgba(180,220,255,0.15)",
                        borderRadius: "12px",
                        boxShadow:
                            "0 8px 32px rgba(0,0,0,0.6)",
                        zIndex: 200,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.875rem 1rem",
                            borderBottom:
                                "1px solid rgba(180,220,255,0.1)",
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                fontFamily:
                                    "'Poppins', sans-serif",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                color: "rgb(220,235,255)",
                            }}
                        >
                            Уведомления

                            {unreadCount > 0 && (
                                <span
                                    style={{
                                        marginLeft: "0.4rem",
                                        color:
                                            "rgb(4,198,233)",
                                        fontSize: "0.8rem",
                                    }}
                                >
                                    ({unreadCount} новых)
                                </span>
                            )}
                        </span>

                        <div
                            style={{
                                display: "flex",
                                gap: "0.5rem",
                            }}
                        >
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleReadAll}
                                    disabled={loading}
                                    style={actionBtn}
                                >
                                    прочитать все
                                </button>
                            )}

                            {notifications.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={loading}
                                    style={{
                                        ...actionBtn,
                                        color: "#ff5555",
                                    }}
                                >
                                    удалить все
                                </button>
                            )}
                        </div>
                    </div>

                    <div
                        style={{
                            overflowY: "auto",
                            flex: 1,
                        }}
                    >
                        {notifications.length === 0 ? (
                            <div
                                style={{
                                    padding: "2rem 1rem",
                                    textAlign: "center",
                                    color: "#555",
                                    fontFamily:
                                        "'Poppins', sans-serif",
                                    fontSize: "0.875rem",
                                }}
                            >
                                Уведомлений нет
                            </div>
                        ) : (
                            notifications.map((n, idx) => {
                                const isUnread =
                                    n.status === "unread";

                                const hasLink = !!getReferTo(
                                    n.notification
                                );

                                return (
                                    <div
                                        key={
                                            n.id != null
                                                ? `notif-${n.id}`
                                                : `notif-idx-${idx}`
                                        }
                                        onClick={() =>
                                            handleNotifClick(n)
                                        }
                                        style={{
                                            padding:
                                                "0.75rem 1rem",
                                            borderBottom:
                                                "1px solid rgba(180,220,255,0.07)",
                                            background:
                                                isUnread
                                                    ? "rgba(4,198,233,0.04)"
                                                    : "transparent",
                                            cursor: "pointer",
                                            transition:
                                                "background 0.15s",
                                            display: "flex",
                                            gap: "0.75rem",
                                            alignItems:
                                                "flex-start",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background =
                                                "rgba(180,220,255,0.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background =
                                                isUnread
                                                    ? "rgba(4,198,233,0.04)"
                                                    : "transparent";
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "8px",
                                                height: "8px",
                                                borderRadius:
                                                    "50%",
                                                background:
                                                    isUnread
                                                        ? "rgb(4,198,233)"
                                                        : "transparent",
                                                border:
                                                    isUnread
                                                        ? "none"
                                                        : "1px solid #333",
                                                flexShrink: 0,
                                                marginTop:
                                                    "5px",
                                            }}
                                        />

                                        <div
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontFamily:
                                                        "'Poppins', sans-serif",
                                                    fontWeight:
                                                        isUnread
                                                            ? 700
                                                            : 500,
                                                    fontSize:
                                                        "0.85rem",
                                                    color:
                                                        isUnread
                                                            ? "rgb(220,235,255)"
                                                            : "#888",
                                                    marginBottom:
                                                        "0.2rem",
                                                    whiteSpace:
                                                        "nowrap",
                                                    overflow:
                                                        "hidden",
                                                    textOverflow:
                                                        "ellipsis",
                                                }}
                                            >
                                                {
                                                    n
                                                        .notification
                                                        ?.title
                                                }
                                            </div>

                                            <div
                                                style={{
                                                    fontFamily:
                                                        "'Poppins', sans-serif",
                                                    fontSize:
                                                        "0.78rem",
                                                    color:
                                                        isUnread
                                                            ? "#a0b8d0"
                                                            : "#555",
                                                    lineHeight:
                                                        1.4,
                                                    wordBreak:
                                                        "break-word",
                                                }}
                                            >
                                                {
                                                    n
                                                        .notification
                                                        ?.body
                                                }
                                            </div>

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap: "0.4rem",
                                                    marginTop:
                                                        "0.3rem",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize:
                                                            "0.72rem",
                                                        color:
                                                            "#4a5568",
                                                        fontFamily:
                                                            "'Poppins', sans-serif",
                                                    }}
                                                >
                                                    {timeAgo(
                                                        n
                                                            .notification
                                                            ?.created_at
                                                    )}
                                                </span>

                                                {hasLink && (
                                                    <span
                                                        style={{
                                                            fontSize:
                                                                "0.7rem",
                                                            color:
                                                                "rgb(4,198,233)",
                                                            fontFamily:
                                                                "'Poppins', sans-serif",
                                                            opacity:
                                                                0.8,
                                                        }}
                                                    >
                                                        · перейти
                                                        →
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) =>
                                                handleDelete(
                                                    n,
                                                    e
                                                )
                                            }
                                            style={{
                                                background:
                                                    "none",
                                                border:
                                                    "none",
                                                color: "#444",
                                                cursor:
                                                    "pointer",
                                                fontSize:
                                                    "14px",
                                                padding:
                                                    "0 0 0 0.25rem",
                                                flexShrink: 0,
                                                lineHeight: 1,
                                                transition:
                                                    "color 0.15s",
                                            }}
                                            onMouseEnter={(
                                                e
                                            ) =>
                                                (e.currentTarget.style.color =
                                                    "#ff5555")
                                            }
                                            onMouseLeave={(
                                                e
                                            ) =>
                                                (e.currentTarget.style.color =
                                                    "#444")
                                            }
                                            aria-label="Удалить"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const actionBtn = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontFamily: "'Poppins', sans-serif",
    color: "rgb(4,198,233)",
    padding: 0,
    transition: "opacity 0.15s",
};

export default NotificationBell;