import { FaUser, FaSignInAlt, FaBars, FaTimes, FaSearch, FaEnvelope} from "react-icons/fa";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { Link, useNavigate } from "react-router-dom";
import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import { API_URL } from "../api/const.js";

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

async function searchAPI(q) {
    if (!q.trim()) return null;
    try {
        const res = await fetch(`${API_URL}/search/${encodeURIComponent(q)}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

function Section({ title, children }) {
    return (
        <div>
            <div style={{ padding: "0.5rem 1rem 0.25rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgb(60,90,120)" }}>
                {title}
            </div>
            {children}
        </div>
    );
}

function ResultRow({ onClick, children }) {
    const [hov, setHov] = useState(false);
    return (
        <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
             style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.55rem 1rem", cursor: "pointer", background: hov ? "rgba(4,198,233,0.07)" : "transparent", transition: "background 0.15s" }}>
            {children}
        </div>
    );
}

function SearchBox({ onClose }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const boxRef = useRef(null);
    const debounced = useDebounce(query, 300);

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        if (!debounced.trim()) { setResults(null); return; }
        setLoading(true);
        searchAPI(debounced).then(data => { setResults(data); setLoading(false); });
    }, [debounced]);

    useEffect(() => {
        const onMouse = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) onClose(); };
        const onKey   = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("mousedown", onMouse);
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("mousedown", onMouse); document.removeEventListener("keydown", onKey); };
    }, [onClose]);

    const go = (path, state) => { navigate(path, { state }); onClose(); };
    const hasResults = !!(results && (results.users?.length || results.categories?.length || results.posts?.length));

    return (
        <div ref={boxRef} style={{
            position: "absolute", top: "calc(100% + 0.75rem)", right: 0,
            width: "min(420px, 90vw)", zIndex: 200,
            background: "#141922", border: "1px solid rgba(4,198,233,0.25)",
            borderRadius: "12px", boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            overflow: "hidden",
        }}>
            {/* Поле ввода */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1rem", borderBottom: "1px solid rgba(100,160,220,0.1)" }}>
                <FaSearch style={{ color: "var(--logo-color)", flexShrink: 0, fontSize: "0.9rem" }} />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Поиск по сайту…"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgb(200,230,255)", fontSize: "0.95rem", fontFamily: "inherit" }}
                />
                {loading && (
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(4,198,233,0.2)", borderTop: "2px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                )}
                {query && !loading && (
                    <button onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}
                            style={{ background: "none", border: "none", color: "rgb(80,110,140)", cursor: "pointer", padding: 0, fontSize: "0.85rem", lineHeight: 1 }}>
                        ✕
                    </button>
                )}
            </div>

            {/* Пусто */}
            {query && !loading && !hasResults && (
                <div style={{ padding: "1.25rem 1rem", color: "rgb(80,110,140)", fontSize: "0.875rem", textAlign: "center" }}>
                    Ничего не найдено
                </div>
            )}

            {/* Результаты */}
            {hasResults && (
                <div style={{ maxHeight: "60vh", overflowY: "auto" }}>

                    {results.users?.length > 0 && (
                        <Section title="Пользователи">
                            {results.users.map(u => (
                                <ResultRow key={u.id} onClick={() => go(`/profile/${u.id}`)}>
                                    <span style={{ fontSize: "1rem" }}>👤</span>
                                    <span style={{ color: "rgb(200,230,255)", fontWeight: 600, fontSize: "0.9rem" }}>{u.username}</span>
                                </ResultRow>
                            ))}
                        </Section>
                    )}

                    {results.categories?.length > 0 && (
                        <Section title="Категории">
                            {results.categories.map(c => (
                                <ResultRow key={c.id} onClick={() => go("/blog", { categoryId: c.id })}>
                                    <span style={{ fontSize: "1.1rem" }}>{c.emoji}</span>
                                    <span style={{ color: "rgb(200,230,255)", fontWeight: 600, fontSize: "0.9rem" }}>{c.name}</span>
                                </ResultRow>
                            ))}
                        </Section>
                    )}

                    {results.posts?.length > 0 && (
                        <Section title="Посты">
                            {results.posts.map(p => (
                                <ResultRow key={p.id} onClick={() => go(`/posts/${p.id}`)}>
                                    <span style={{ fontSize: "1rem" }}>📝</span>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ color: "rgb(200,230,255)", fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {p.title}
                                        </div>
                                        <div style={{ color: "rgb(80,110,140)", fontSize: "0.775rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {p.content?.replace(/<[^>]+>/g, "").slice(0, 80)}
                                        </div>
                                    </div>
                                </ResultRow>
                            ))}
                        </Section>
                    )}
                </div>
            )}
        </div>
    );
}

function Header() {
    const { user, logoutUser } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

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
    const closeSearch = useCallback(() => setSearchOpen(false), []);

    const linkStyle = {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontWeight: 600,
        textDecoration: "none",
        padding: "0.4rem 0",
        fontSize: "1rem",
    };

    return (
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", position: "relative" }}>
            <span className="logo">
                <Link to="/" onClick={close} style={{ color: "rgb(180, 255, 255)", fontWeight: "bold", fontSize: "1.6rem" }}>
                    zerw1337's website
                </Link>
            </span>

            <button onClick={() => setMenuOpen(o => !o)} className="burger-btn" aria-label="Меню">
                {menuOpen ? <FaTimes /> : <FaBars />}
            </button>

            <nav className={`main-nav${menuOpen ? " nav-open" : ""}`}>
                <Link to="/" style={linkStyle} onClick={close}>Домой</Link>
                <Link to="/blog" style={linkStyle} onClick={close}>Блог</Link>
                <Link to="/about" style={linkStyle} onClick={close}>О себе</Link>
                <Link to="/contact" style={linkStyle} onClick={close}>Контакты</Link>

                {/* Кнопка поиска + выпадающий блок */}
                <div style={{ position: "relative" }}>
                    <button
                        onClick={() => setSearchOpen(o => !o)}
                        aria-label="Поиск"
                        style={{
                            background: searchOpen ? "rgba(4,198,233,0.12)" : "none",
                            border: "1px solid " + (searchOpen ? "rgba(4,198,233,0.4)" : "transparent"),
                            borderRadius: "8px",
                            color: searchOpen ? "var(--logo-color)" : "rgb(180,220,255)",
                            cursor: "pointer",
                            padding: "0.35rem 0.5rem",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "1rem",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { if (!searchOpen) { e.currentTarget.style.color = "rgb(180,255,255)"; e.currentTarget.style.borderColor = "rgba(4,198,233,0.2)"; }}}
                        onMouseLeave={e => { if (!searchOpen) { e.currentTarget.style.color = "rgb(180,220,255)"; e.currentTarget.style.borderColor = "transparent"; }}}
                    >
                        <FaSearch />
                    </button>

                    {searchOpen && <SearchBox onClose={closeSearch} />}
                </div>

                {user ? (
                    <>

                        <NotificationBell onClose={close} />
                        <Link to="/messages" style={linkStyle} onClick={close}>
                            <FaEnvelope />
                        </Link>
                        {getIsSuperuser() && <Link to="/admin" onClick={close} style={linkStyle}><HiOutlineCog6Tooth size={24} /></Link>}
                        <a href={`/profile/${getMyId()}`} onClick={close} style={linkStyle}>{user.username}</a>
                        <button onClick={() => { logoutUser(); close(); }}
                                style={{ ...linkStyle, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
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

            {menuOpen && (
                <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 98, background: "rgba(0,0,0,0.4)" }} />
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .burger-btn {
                    display: none;
                    background: none;
                    border: none;
                    color: rgb(180, 220, 255);
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.25rem;
                }

                .main-nav {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .main-nav a,
                .main-nav button {
                    color: rgb(180, 220, 255);
                    transition: all 0.2s ease;
                }

                .main-nav a:hover,
                .main-nav button:hover {
                    color: rgb(180, 255, 255);
                    transform: translateY(-1px);
                    text-shadow: 0 0 6px rgba(180,255,255,0.4);
                }

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
                    .burger-btn { display: block; }

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
                        background: rgba(0,0,0,0.9);
                        border-left: 1px solid #333;
                        padding: 4rem 2rem 2rem;
                        z-index: 99;
                        box-shadow: -4px 0 20px rgba(0,0,0,0.25);
                        overflow-y: auto;
                    }

                    .main-nav.nav-open { display: flex; }

                    .main-nav a,
                    .main-nav button {
                        font-size: 1.1rem;
                        padding: 0.6rem 0;
                        width: 100%;
                        border-bottom: 1px solid rgba(180,220,255,0.2);
                    }
                }
            `}</style>
        </header>
    );
}

export default Header;