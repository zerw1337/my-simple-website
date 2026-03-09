import React from "react";
import { FaGithub, FaTelegramPlane, FaSteam, FaEnvelope, FaVk, FaTwitch } from "react-icons/fa";


const contacts = [
    {
        icon: <FaTelegramPlane size={28} />,
        label: "Telegram",
        value: "@glebus777",
        href: "https://t.me/glebus777",
        color: "#29b6d8",
    },
    {
        icon: <FaGithub size={28} />,
        label: "GitHub",
        value: "zerw1337",
        href: "https://github.com/zerw1337",
        color: "#e0e0e0",
    },
    {
        icon: <FaEnvelope size={28} />,
        label: "Email",
        value: "ivanovgleb2011@gmail.com",
        href: "mailto:ivanovgleb2011@gmail.com",
        color: "#ea4335",
    },
    {
        icon: <FaSteam size={28} />,
        label: "Steam",
        value: "zerw1337",
        href: "https://steamcommunity.com/id/zerw1337",
        color: "#c7d5e0",
    },
    {
        icon: <FaVk size={28} />,
        label: "ВКонтакте",
        value: "glebivv",
        href: "https://vk.com/glebivv",
        color: "#4680c2",
    },
    {
        icon: <FaTwitch size={28} />,
        label: "Twitch",
        value: "zerw1337",
        href: "https://www.twitch.tv/zerw1337",
        color: "#9146ff",
    },
];

function Contacts() {
    return (
        <main>
            <div style={{ maxWidth: "600px", margin: "2rem auto" }}>

                <div style={{
                    background: "#1f1f1f",
                    borderRadius: "12px",
                    padding: "1.75rem 2rem",
                    marginBottom: "1.5rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    borderLeft: "4px solid var(--logo-color)",
                }}>
                    <h1 style={{ margin: "0 0 0.25rem", fontSize: "2rem", color: "var(--logo-color)" }}>Контакты</h1>
                    <p style={{ margin: 0, color: "#a0a0a0", fontSize: "0.95rem" }}>
                        Связаться со мной можно любым удобным способом.
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {contacts.map(c => (
                        <a
                            key={c.label}
                            href={c.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none" }}
                        >
                            <div
                                style={{
                                    background: "#1f1f1f",
                                    border: "1px solid #333",
                                    borderRadius: "10px",
                                    padding: "1rem 1.25rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    transition: "border-color 0.2s, transform 0.15s",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = c.color;
                                    e.currentTarget.style.transform = "translateX(4px)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "#333";
                                    e.currentTarget.style.transform = "translateX(0)";
                                }}
                            >
                                <div style={{
                                    color: c.color,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "48px",
                                    height: "48px",
                                    background: c.color + "18",
                                    borderRadius: "10px",
                                    flexShrink: 0,
                                }}>
                                    {c.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.8rem", color: "#a0a0a0", fontFamily: "'Poppins', sans-serif" }}>
                                        {c.label}
                                    </div>
                                    <div style={{ fontWeight: 600, color: "var(--main-text-color)", fontFamily: "'Poppins', sans-serif" }}>
                                        {c.value}
                                    </div>
                                </div>
                                <div style={{ marginLeft: "auto", color: "#444", fontSize: "1.2rem" }}>→</div>
                            </div>
                        </a>
                    ))}
                </div>

            </div>
        </main>
    );
}

export default Contacts;
