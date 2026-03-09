import React from "react";
import { useNavigate } from "react-router-dom";
import notFoundImg from "../assets/images/404nf.png";

function NotFound() {
    const navigate = useNavigate();

    return (
        <main style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "3rem" }}>
            <div style={{ textAlign: "center" }}>
                <img src={notFoundImg} alt="404"/>
                <p style={{ fontSize: "1.2rem", color: "#a0a0a0", margin: "1rem 0 1rem" }}>
                    Страница не найдена
                </p>
                <button
                    onClick={() => navigate("/")}
                    style={{
                        padding: "0.5rem 1.5rem",
                        background: "transparent",
                        border: "1px solid var(--logo-color)",
                        borderRadius: "6px",
                        color: "var(--logo-color)",
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        fontSize: "1rem",
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--logo-color)"; e.currentTarget.style.color = "var(--bg-main)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--logo-color)"; }}
                >
                    На главную
                </button>
            </div>
        </main>
    );
}

export default NotFound;