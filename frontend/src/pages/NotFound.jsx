import React from "react";
import img404 from "../assets/images/404nf.png";

function NotFound() {
    return (
        <main>
            <div style={{ maxWidth: "500px", margin: "5rem auto", textAlign: "center", padding: "2rem" }}>
                <img src={img404} alt="404" style={{ width: "200px", opacity: 0.7, marginBottom: "2rem", filter: "brightness(0.8) hue-rotate(190deg)" }} />
                <h1 style={{ color: "rgb(180,255,255)", marginBottom: "0.5rem", textShadow: "0 0 12px rgba(180,255,255,0.2)" }}>404</h1>
                <p style={{ color: "rgb(100,130,160)", marginBottom: "2rem" }}>Страница не найдена</p>
                <a href="/" style={{
                    display: "inline-block",
                    padding: "0.6rem 1.5rem",
                    background: "rgba(4,198,233,0.1)",
                    border: "1px solid rgba(4,198,233,0.3)",
                    borderRadius: "8px",
                    color: "var(--logo-color)",
                    textDecoration: "none",
                    fontFamily: "inherit",
                    fontWeight: 600,
                    transition: "all 0.2s",
                }}
                   onMouseEnter={e => { e.currentTarget.style.background = "rgba(4,198,233,0.15)"; e.currentTarget.style.color = "rgb(180,255,255)"; }}
                   onMouseLeave={e => { e.currentTarget.style.background = "rgba(4,198,233,0.1)"; e.currentTarget.style.color = "var(--logo-color)"; }}>
                    На главную
                </a>
            </div>
        </main>
    );
}

export default NotFound;