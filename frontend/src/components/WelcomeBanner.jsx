import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWelcomeNotifications } from "../api/Notifications.js";

function toLocalPath(referTo) {
    if (!referTo) return null;
    try { return new URL(referTo).pathname; }
    catch { return referTo.startsWith("/") ? referTo : `/${referTo}`; }
}

function WelcomeBanner() {
    const [notifications, setNotifications] = useState([]);
    const [dismissed, setDismissed] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem("dismissed_welcome") || "[]"); }
        catch { return []; }
    });

    useEffect(() => {
        getWelcomeNotifications()
            .then(setNotifications)
            .catch(() => setNotifications([]));
    }, []);

    const dismiss = (id) => {
        const next = [...dismissed, id];
        setDismissed(next);
        try { sessionStorage.setItem("dismissed_welcome", JSON.stringify(next)); } catch {}
    };

    const visible = notifications.filter((n) => !dismissed.includes(n.id));
    if (visible.length === 0) return null;

    return (
        <>
            <div style={{
                position: "fixed",
                top: "4.5rem",
                right: "1.25rem",
                zIndex: 500,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                alignItems: "flex-end",
                maxWidth: "300px",
                pointerEvents: "none",
            }}>
                {visible.map((notif) => {
                    const path = toLocalPath(notif.refer_to);
                    return (
                        <div
                            key={notif.id}
                            style={{
                                background: "rgba(18, 24, 36, 0.95)",
                                border: "1px solid rgba(4,198,233,0.25)",
                                borderLeft: "3px solid rgba(4,198,233,0.7)",
                                borderRadius: "8px",
                                padding: "0.6rem 2rem 0.6rem 0.75rem",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                                pointerEvents: "all",
                                position: "relative",
                                width: "100%",
                                backdropFilter: "blur(8px)",
                                animation: "slideIn 0.3s ease",
                            }}
                        >
                            <div style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                color: "rgb(220,235,255)",
                                marginBottom: "0.2rem",
                            }}>
                                {notif.pinned && (
                                    <span style={{ color: "rgb(4,198,233)", marginRight: "0.3rem", fontSize: "0.7rem" }}>📌</span>
                                )}
                                {notif.title}
                            </div>

                            <div style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: "0.73rem",
                                color: "#7a9ab8",
                                lineHeight: 1.4,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}>
                                {notif.content}
                            </div>

                            {path && (
                                <Link to={path} style={{
                                    display: "inline-block",
                                    marginTop: "0.3rem",
                                    fontFamily: "'Poppins', sans-serif",
                                    fontSize: "0.7rem",
                                    color: "rgb(4,198,233)",
                                    textDecoration: "none",
                                    opacity: 0.85,
                                }}
                                      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                      onMouseLeave={e => e.currentTarget.style.opacity = "0.85"}
                                >
                                    Подробнее →
                                </Link>
                            )}

                            <button
                                onClick={() => dismiss(notif.id)}
                                aria-label="Закрыть"
                                style={{
                                    position: "absolute",
                                    top: "6px",
                                    right: "7px",
                                    background: "none",
                                    border: "none",
                                    color: "#3a5068",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    lineHeight: 1,
                                    padding: "1px",
                                    transition: "color 0.15s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = "#7a9ab8"}
                                onMouseLeave={e => e.currentTarget.style.color = "#3a5068"}
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </>
    );
}

export default WelcomeBanner;