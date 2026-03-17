import { FaUser, FaSignInAlt, FaBars, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

function Header() {
    const { user, logoutUser } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(false);

    const getIsSuperuser = () => {
        const token = localStorage.getItem("access_token");
        if (!token) return false;
        try { return JSON.parse(atob(token.split(".")[1])).is_superuser === true; } catch { return false; }
    };
    const getMyId = () => {
        const token = localStorage.getItem("access_token");
        if (!token) return null;
        try { return JSON.parse(atob(token.split(".")[1])).sub; } catch { return null; }
    };

    const close = () => setMenuOpen(false);

    const linkStyle = {
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 600,
        textDecoration: "none",
        padding: "0.4rem 0",
        fontSize: "1rem",
    };

    return (
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", position: "relative" }}>
            <span className="logo">
                <Link to="/" onClick={close}>zerw1337's website</Link>
            </span>

            {/* Бургер кнопка — только на мобиле */}
            <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                    display: "none",
                    background: "none",
                    border: "none",
                    color: "var(--menu-item-color)",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    padding: "0.25rem",
                }}
                className="burger-btn"
                aria-label="Меню"
            >
                {menuOpen ? <FaTimes /> : <FaBars />}
            </button>

            {/* Навигация */}
            <nav className={`main-nav${menuOpen ? " nav-open" : ""}`}>
                <Link to="/" style={linkStyle} onClick={close}>Домой</Link>
                <Link to="/blog" style={linkStyle} onClick={close}>Блог</Link>
                <Link to="/about" style={linkStyle} onClick={close}>О себе</Link>
                <Link to="/contact" style={linkStyle} onClick={close}>Контакты</Link>

                {user ? (
                    <>
                        {getIsSuperuser() && (
                            <Link to="/admin" onClick={close} className="accent" style={linkStyle}>Админ</Link>
                        )}
                        <a href={`/profile/${getMyId()}`} onClick={close} className="accent" style={linkStyle}>
                            {user.username}
                        </a>
                        <button
                            onClick={() => { logoutUser(); close(); }}
                            style={{
                                ...linkStyle,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "inherit",
                                padding: "0.4rem 0",
                                textAlign: "left",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = "var(--logo-color)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "var(--menu-item-color)"; }}
                        >
                            Выйти
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={linkStyle} onClick={close}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><FaSignInAlt /> Login</span>
                        </Link>
                        <Link to="/register" style={linkStyle} onClick={close}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><FaUser /> Register</span>
                        </Link>
                    </>
                )}
            </nav>

            {/* Оверлей для закрытия меню */}
            {menuOpen && (
                <div
                    onClick={close}
                    style={{
                        position: "fixed", inset: 0,
                        zIndex: 98,
                        background: "rgba(0,0,0,0.4)",
                    }}
                />
            )}

            <style>{`
                .main-nav {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .main-nav a, .main-nav button {
                    color: var(--menu-item-color);
                    transition: color 0.2s;
                }
                .main-nav a:hover, .main-nav button:hover { color: var(--logo-color); }
                .main-nav a.accent { color: var(--logo-color); }
                .main-nav a.accent:hover { color: var(--menu-item-color); }

                @media (max-width: 1280px) {
                    .logo { font-size: 1.4rem !important; }
                    .main-nav { gap: 0.4rem; }
                    .main-nav a, .main-nav button { font-size: 0.85rem; }
                }

                @media (max-width: 1100px) {
                    .logo { font-size: 1.3rem !important; }
                    .main-nav { gap: 0.3rem; }
                    .main-nav a, .main-nav button { font-size: 0.8rem; }
                }

                @media (max-width: 768px) {
                    .burger-btn { display: block !important; }

                    .main-nav {
                        display: none;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.25rem;
                        position: fixed;
                        top: 0; right: 0;
                        width: 70vw;
                        max-width: 280px;
                        height: 100vh;
                        background: #1a1a1a;
                        border-left: 1px solid #333;
                        padding: 4rem 2rem 2rem;
                        z-index: 99;
                        box-shadow: -4px 0 20px rgba(0,0,0,0.5);
                        overflow-y: auto;
                    }
                    .main-nav.nav-open { display: flex; }
                    .main-nav a, .main-nav button { font-size: 1.1rem; padding: 0.6rem 0; width: 100%; border-bottom: 1px solid #2a2a2a; }
                }
            `}</style>
        </header>
    );
}

export default Header;