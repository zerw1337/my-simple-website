import { FaUser, FaSignInAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

function Header() {
    const { user, logoutUser } = useContext(AuthContext);

    return (
        <header
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "1rem",
            }}
        >
            <span className="logo">
                <Link to="/">zerw1337's website</Link>
            </span>

            <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <Link to="/">Домой</Link>
                <Link to="/blog">Блог</Link>
                <Link to="/about">О себе</Link>
                <Link to="/contact">Контакты</Link>

                {user ? (
                    <>

                        <span
                            className="header-user"
                            style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 600,
                                color: "var(--menu-item-color)",
                                cursor: "default",
                                marginLeft: "1rem",
                                padding: "0.2rem 0.4rem",
                                borderRadius: "4px",
                                transition: "all 0.3s ease",
                            }}
                        >
                            <a href="/profile">{user.username}</a>
                        </span>

                        <button
                            onClick={logoutUser}
                            style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 600,
                                color: "var(--menu-item-color)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "0.2rem 0.4rem",
                                marginLeft: "1rem",
                                fontSize: "inherit",
                                borderRadius: "4px",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = "var(--logo-color)";
                                e.currentTarget.style.color = "var(--bg-main)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "var(--menu-item-color)";
                            }}
                        >
                            Выйти
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
                        >
                            <FaSignInAlt /> Login
                        </Link>
                        <Link
                            to="/register"
                            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
                        >
                            <FaUser /> Register
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}

export default Header;