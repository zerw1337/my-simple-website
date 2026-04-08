import React from "react";
import { FaGithub, FaTelegramPlane, FaSteam, FaEnvelope, FaVk, FaTwitch } from "react-icons/fa";

const contacts = [
    { icon: <FaTelegramPlane size={24} />, label: "Telegram", value: "@glebus777", href: "https://t.me/glebus777", color: "#29b6d8" },
    { icon: <FaGithub size={24} />, label: "GitHub", value: "zerw1337", href: "https://github.com/zerw1337", color: "#c0d0e0" },
    { icon: <FaEnvelope size={24} />, label: "Email", value: "ivanovgleb2011@gmail.com", href: "mailto:ivanovgleb2011@gmail.com", color: "#ea4335" },
    { icon: <FaSteam size={24} />, label: "Steam", value: "zerw1337", href: "https://steamcommunity.com/id/zerw1337", color: "#a8c4d8" },
    { icon: <FaVk size={24} />, label: "ВКонтакте", value: "glebivv", href: "https://vk.com/glebivv", color: "#5b8ac4" },
    { icon: <FaTwitch size={24} />, label: "Twitch", value: "zerw1337", href: "https://www.twitch.tv/zerw1337", color: "#9146ff" },
];

function Contacts() {
    return (
        <main style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    padding: "4rem 2rem",
                    textAlign: "center",
                    overflow: "hidden",
                    boxSizing: "border-box",
                }}
            >
                {/* SVG-задник */}
                <svg
                    viewBox="0 0 1200 300"
                    preserveAspectRatio="none"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                >
                    {/* Мягкие волнистые линии */}
                    <path
                        d="M0 50 C300 80 900 20 1200 50"
                        stroke="rgba(180,255,255,0.06)"
                        strokeWidth="3"
                        fill="none"
                    />
                    <path
                        d="M0 120 C400 150 800 90 1200 120"
                        stroke="rgba(180,255,255,0.05)"
                        strokeWidth="2"
                        fill="none"
                    />
                    <path
                        d="M0 200 C200 230 1000 170 1200 200"
                        stroke="rgba(180,255,255,0.04)"
                        strokeWidth="2"
                        fill="none"
                    />
                    {/* Случайные небольшие элементы как акцент */}
                    <circle cx="150" cy="60" r="3" fill="rgba(180,255,255,0.08)" />
                    <circle cx="400" cy="130" r="2" fill="rgba(180,255,255,0.07)" />
                    <circle cx="800" cy="190" r="2" fill="rgba(180,255,255,0.06)" />
                </svg>

                {/* Основной текст */}
                <p
                    style={{
                        fontSize: "3.5rem",
                        fontWeight: "900",
                        marginBottom: "1rem",
                        color: "rgb(180, 255, 255)",
                        letterSpacing: "-0.02em",
                        textTransform: "uppercase",
                        textShadow: "2px 2px 10px rgba(0, 200, 255, 0.3)",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    Контакты
                </p>
                <p
                    style={{
                        fontSize: "1.65rem",
                        color: "rgb(180, 220, 255)",
                        lineHeight: "1.8",
                        position: "relative",
                        zIndex: 1,
                        maxWidth: "800px",
                        margin: "0 auto",
                    }}
                >
                    Связаться со мной можно любым удобным для вас способом.
                </p>
            </div>

            <div style={{ width: "100%", overflow: "hidden", lineHeight: 0, margin: "2rem 0", marginTop: "0rem" }}>
                <svg
                    viewBox="0 0 1200 60"
                    preserveAspectRatio="none"
                    style={{ width: "100%", height: "40px", display: "block" }}
                >
                    <path
                        d="M0,30
               C150,20 300,40 450,30
               C600,20 750,40 900,30
               C1050,20 1200,30 1200,30"
                        style={{
                            fill: "none",
                            stroke: "rgb(180, 255, 255)",
                            strokeWidth: 2,
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            opacity: 0.7
                        }}
                    />
                </svg>
            </div>


            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {contacts.map(c => (
                        <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <div style={{
                                background: "#161b24",
                                border: "1px solid rgba(100,160,220,0.12)",
                                borderRadius: "12px",
                                padding: "1rem 1.25rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                transition: "all 0.2s",
                            }}
                                 onMouseEnter={e => {
                                     e.currentTarget.style.borderColor = c.color + "66";
                                     e.currentTarget.style.background = "#1a2030";
                                     e.currentTarget.style.transform = "translateX(5px)";
                                     e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${c.color}18`;
                                 }}
                                 onMouseLeave={e => {
                                     e.currentTarget.style.borderColor = "rgba(100,160,220,0.12)";
                                     e.currentTarget.style.background = "#161b24";
                                     e.currentTarget.style.transform = "translateX(0)";
                                     e.currentTarget.style.boxShadow = "none";
                                 }}>
                                <div style={{
                                    color: c.color, display: "flex", alignItems: "center", justifyContent: "center",
                                    width: "44px", height: "44px",
                                    background: c.color + "14",
                                    borderRadius: "10px", flexShrink: 0,
                                }}>
                                    {c.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.75rem", color: "rgb(80,110,140)", fontFamily: "inherit", marginBottom: "0.1rem" }}>{c.label}</div>
                                    <div style={{ fontWeight: 600, color: "rgb(180,220,255)", fontFamily: "inherit", fontSize: "0.95rem" }}>{c.value}</div>
                                </div>
                                <div style={{ marginLeft: "auto", color: "rgb(60,90,120)", fontSize: "1rem" }}>→</div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </main>
    );
}

export default Contacts;