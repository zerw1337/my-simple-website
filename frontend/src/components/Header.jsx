import { FaSignInAlt, FaBars, FaTimes, FaSearch, FaEnvelope, FaUser } from "react-icons/fa";
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
    } catch { return null; }
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1rem", borderBottom: "1px solid rgba(100,160,220,0.1)" }}>
                <FaSearch style={{ color: "var(--logo-color)", flexShrink: 0, fontSize: "0.9rem" }} />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Поиск по сайту…"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgb(200,230,255)", fontSize: "0.95rem", fontFamily: "inherit" }}
                />
                {loading && <div style={{ width: 16, height: 16, border: "2px solid rgba(4,198,233,0.2)", borderTop: "2px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />}
                {query && !loading && (
                    <button onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}
                            style={{ background: "none", border: "none", color: "rgb(80,110,140)", cursor: "pointer", padding: 0, fontSize: "0.85rem", lineHeight: 1 }}>✕</button>
                )}
            </div>

            {query && !loading && !hasResults && (
                <div style={{ padding: "1.25rem 1rem", color: "rgb(80,110,140)", fontSize: "0.875rem", textAlign: "center" }}>Ничего не найдено</div>
            )}

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
                                        <div style={{ color: "rgb(200,230,255)", fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                                        <div style={{ color: "rgb(80,110,140)", fontSize: "0.775rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.content?.replace(/<[^>]+>/g, "").slice(0, 80)}</div>
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

// Единая кнопка-иконка для панели иконок
function IconBtn({ onClick, active, label, children }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            aria-label={label}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36,
                background: active || hov ? "rgba(4,198,233,0.1)" : "transparent",
                border: "1px solid " + (active ? "rgba(4,198,233,0.45)" : hov ? "rgba(4,198,233,0.2)" : "transparent"),
                borderRadius: "9px",
                color: active || hov ? "var(--logo-color)" : "rgb(160,200,240)",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.18s",
                flexShrink: 0,
            }}
        >
            {children}
        </button>
    );
}

function Header() {
    const { user, logoutUser } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const current = window.scrollY;
            if (current < 200) { setVisible(true); }
            else if (current < lastScrollY.current) { setVisible(true); }
            else if (current > lastScrollY.current + 4) { setVisible(false); }
            lastScrollY.current = current;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

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

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .hdr-root {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    height: 62px;
                    background: rgba(13, 17, 26, 0.82);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    border-bottom: 1px solid rgba(100, 160, 220, 0.1);
                    box-shadow: 0 2px 20px rgba(0,0,0,0.35);
                }

                .hdr-inner {
                    max-width: 1400px;
                    margin: 0 auto;
                    height: 100%;
                    display: grid;
                    grid-template-columns: 0.7fr 2fr 1.5fr;
                    align-items: center;
                    padding: 0 2rem;
                    gap: 1rem;
                }

                /* Лого */
                .hdr-logo {
                    color: rgb(180, 255, 255);
                    font-weight: 800;
                    font-size: 1.25rem;
                    text-decoration: none;
                    letter-spacing: -0.01em;
                    white-space: nowrap;
                    flex-shrink: 0;
                    text-shadow: 0 0 20px rgba(4,198,233,0.3);
                    transition: text-shadow 0.2s;
                }
                .hdr-logo:hover { text-shadow: 0 0 28px rgba(4,198,233,0.6); }

                /* Разделитель */
                .hdr-divider {
                    width: 1px;
                    height: 20px;
                    background: rgba(100,160,220,0.2);
                    flex-shrink: 0;
                }

                /* Основная навигация */
                .hdr-nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 2rem;
                }

                .hdr-nav .hdr-link {
                    flex: none;
                    text-align: center;
                }

                .hdr-link {
                    font-weight: 600;
                    font-size: 0.9rem;
                    text-decoration: none;
                    color: rgb(160, 200, 240);
                    padding: 0.35rem 0.75rem;
                    border-radius: 8px;
                    border: 1px solid transparent;
                    transition: all 0.18s;
                    white-space: nowrap;
                }
                .hdr-link:hover {
                    color: rgb(200, 240, 255);
                    background: rgba(4,198,233,0.07);
                    border-color: rgba(4,198,233,0.15);
                }

                /* Правая панель: иконки + юзер */
                .hdr-right {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    justify-content: flex-end;
                }

                /* Имя пользователя */
                .hdr-username {
                    font-weight: 700;
                    font-size: 0.875rem;
                    color: rgb(180, 255, 255);
                    text-decoration: none;
                    padding: 0.35rem 0.65rem;
                    border-radius: 8px;
                    border: 1px solid rgba(4,198,233,0.2);
                    background: rgba(4,198,233,0.06);
                    white-space: nowrap;
                    transition: all 0.18s;
                }
                .hdr-username:hover {
                    background: rgba(4,198,233,0.14);
                    border-color: rgba(4,198,233,0.4);
                }

                /* Кнопка «Выйти» */
                .hdr-logout {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: rgb(120,160,200);
                    background: none;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    padding: 0.35rem 0.65rem;
                    cursor: pointer;
                    font-family: inherit;
                    white-space: nowrap;
                    transition: all 0.18s;
                }
                .hdr-logout:hover {
                    color: rgb(255,100,100);
                    border-color: rgba(255,80,80,0.25);
                    background: rgba(255,60,60,0.07);
                }

                /* Обёртка для NotificationBell — тот же стиль что IconBtn */
                .hdr-bell-wrap > * {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                .hdr-bell-wrap button {
                    width: 36px !important;
                    height: 36px !important;
                    background: transparent !important;
                    border: 1px solid transparent !important;
                    border-radius: 9px !important;
                    color: rgb(160,200,240) !important;
                    transition: all 0.18s !important;
                }
                .hdr-bell-wrap button:hover {
                    background: rgba(4,198,233,0.1) !important;
                    border-color: rgba(4,198,233,0.2) !important;
                    color: var(--logo-color) !important;
                }

                /* Бургер — скрыт на десктопе */
                .hdr-burger {
                    display: none;
                    background: none;
                    border: 1px solid rgba(100,160,220,0.2);
                    border-radius: 8px;
                    color: rgb(160,200,240);
                    font-size: 1.1rem;
                    cursor: pointer;
                    padding: 0.4rem 0.5rem;
                    line-height: 1;
                }

                /* Мобильное меню */
                @media (max-width: 820px) {
                    .hdr-inner { grid-template-columns: 1fr auto; }
                    .hdr-burger { display: flex; align-items: center; }
                    .hdr-nav, .hdr-right { display: none; }

                    .hdr-mobile-nav {
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;
                        position: fixed;
                        top: 0; right: 0;
                        width: 72vw; max-width: 300px;
                        height: 100vh;
                        background: rgba(10,14,22,0.97);
                        backdrop-filter: blur(16px);
                        border-left: 1px solid rgba(100,160,220,0.12);
                        padding: 4.5rem 1.5rem 2rem;
                        z-index: 999;
                        box-shadow: -8px 0 32px rgba(0,0,0,0.4);
                        overflow-y: auto;
                    }

                    .hdr-mobile-nav .hdr-link,
                    .hdr-mobile-nav .hdr-logout {
                        font-size: 1rem;
                        padding: 0.65rem 0.75rem;
                        border-bottom: 1px solid rgba(100,160,220,0.08);
                        border-radius: 0;
                        border-left: none;
                        border-right: none;
                        border-top: none;
                    }
                }
            `}</style>

            <header className="hdr-root" style={{ transform: visible ? "translateY(0)" : "translateY(-100%)", transition: "transform 0.3s ease" }}>
                <div className="hdr-inner">

                    {/* Лого — левая колонка */}
                    <Link to="/" className="hdr-logo" onClick={close}>
                        zerw1337's website
                    </Link>

                    {/* Навигационные ссылки — центральная колонка */}
                    <nav className="hdr-nav">
                        <Link to="/"        className="hdr-link" onClick={close}>Домой</Link>
                        <Link to="/blog"    className="hdr-link" onClick={close}>Блог</Link>
                        <Link to="/about"   className="hdr-link" onClick={close}>О себе</Link>
                        <Link to="/contact" className="hdr-link" onClick={close}>Контакты</Link>
                    </nav>

                    {/* Правая панель — правая колонка */}
                    <div className="hdr-right">

                        {/* Поиск */}
                        <div style={{ position: "relative" }}>
                            <IconBtn onClick={() => setSearchOpen(o => !o)} active={searchOpen} label="Поиск">
                                <FaSearch />
                            </IconBtn>
                            {searchOpen && <SearchBox onClose={closeSearch} />}
                        </div>

                        {user ? (
                            <>
                                {/* Уведомления */}
                                <div className="hdr-bell-wrap">
                                    <NotificationBell onClose={close} />
                                </div>

                                {/* Сообщения */}
                                <Link to="/messages" onClick={close} style={{ textDecoration: "none" }}>
                                    <IconBtn label="Сообщения"><FaEnvelope /></IconBtn>
                                </Link>

                                {/* Админка (только superuser) */}
                                {getIsSuperuser() && (
                                    <Link to="/admin" onClick={close} style={{ textDecoration: "none" }}>
                                        <IconBtn label="Админ"><HiOutlineCog6Tooth size={18} /></IconBtn>
                                    </Link>
                                )}

                                <div className="hdr-divider" />

                                {/* Имя пользователя → профиль */}
                                <a href={`/profile/${getMyId()}`} onClick={close} className="hdr-username">
                                    {user.username}
                                </a>

                                {/* Выйти */}
                                <button onClick={() => { logoutUser(); close(); }} className="hdr-logout">
                                    Выйти
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="hdr-link" onClick={close} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <FaSignInAlt size={13} /> Войти
                                </Link>
                                <Link to="/register" className="hdr-link" onClick={close} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <FaUser size={13} /> Регистрация
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Бургер (мобилки) */}
                    <button className="hdr-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Меню">
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </header>

            {/* Мобильное меню */}
            {menuOpen && (
                <>
                    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.5)" }} />
                    <nav className="hdr-mobile-nav">
                        <Link to="/"        className="hdr-link" onClick={close}>Домой</Link>
                        <Link to="/blog"    className="hdr-link" onClick={close}>Блог</Link>
                        <Link to="/about"   className="hdr-link" onClick={close}>О себе</Link>
                        <Link to="/contact" className="hdr-link" onClick={close}>Контакты</Link>
                        {user ? (
                            <>
                                <Link to="/messages" className="hdr-link" onClick={close}>✉ Сообщения</Link>
                                {getIsSuperuser() && <Link to="/admin" className="hdr-link" onClick={close}>⚙ Админ</Link>}
                                <a href={`/profile/${getMyId()}`} className="hdr-link" onClick={close}>{user.username}</a>
                                <button onClick={() => { logoutUser(); close(); }} className="hdr-logout" style={{ textAlign: "left" }}>Выйти</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login"    className="hdr-link" onClick={close}>Войти</Link>
                                <Link to="/register" className="hdr-link" onClick={close}>Регистрация</Link>
                            </>
                        )}
                    </nav>
                </>
            )}
        </>
    );
}

export default Header;