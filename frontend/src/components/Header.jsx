import { FaSignInAlt, FaBars, FaTimes, FaSearch, FaEnvelope, FaUser, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import { API_URL } from "../api/const.js";
import { getCachedAvatarUrl, peekAvatarUrl } from "../api/avatarCache.js";

/* ─── утилиты ──────────────────────────────────────────────────── */
function stripHtml(html) {
    if (!html) return "";
    // Удаляем HTML-теги с содержимым где нет текста
    let text = html
        .replace(/<(script|style|img|video|audio|iframe|figure)[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/<(img|br|hr)[^>]*\/?>/gi, " ");
    // DOMParser для остальных HTML-тегов и декодирования энтити
    try {
        const doc = new DOMParser().parseFromString(text, "text/html");
        text = doc.body.textContent ?? text;
    } catch {
        text = text.replace(/<[^>]+>/g, " ");
    }
    // Кастомный формат [tag]...[/tag] и [tag:value]
    text = text
        .replace(/\[img:[^\]]*\]/gi, "")
        .replace(/\[\/?\w+(?::\w+)?\]/g, "");
    return text.replace(/\s+/g, " ").trim();
}

function useDebounce(value, delay) {
    const [d, setD] = useState(value);
    useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
    return d;
}

async function searchAPI(q) {
    if (!q.trim()) return null;
    try {
        const r = await fetch(`${API_URL}/search/${encodeURIComponent(q)}`);
        return r.ok ? await r.json() : null;
    } catch { return null; }
}

/* ─── поиск ────────────────────────────────────────────────────── */
function SearchBox({ onClose }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const boxRef   = useRef(null);
    const debounced = useDebounce(query, 300);

    useEffect(() => { inputRef.current?.focus(); }, []);
    useEffect(() => {
        if (!debounced.trim()) { setResults(null); return; }
        setLoading(true);
        searchAPI(debounced).then(d => { setResults(d); setLoading(false); });
    }, [debounced]);
    useEffect(() => {
        const om = e => { if (boxRef.current && !boxRef.current.contains(e.target)) onClose(); };
        const ok = e => { if (e.key === "Escape") onClose(); };
        document.addEventListener("mousedown", om);
        document.addEventListener("keydown", ok);
        return () => { document.removeEventListener("mousedown", om); document.removeEventListener("keydown", ok); };
    }, [onClose]);

    const go = (path, state) => { navigate(path, { state }); onClose(); };
    const has = !!(results && (results.users?.length || results.categories?.length || results.posts?.length));

    const SectionTitle = ({ t }) => (
        <div style={{ padding: "0.5rem 1rem 0.2rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(4,198,233,0.5)" }}>{t}</div>
    );
    const Row = ({ onClick: oc, icon, title, sub }) => {
        const [h, setH] = useState(false);
        return (
            <div onClick={oc} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
                 style={{ display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.5rem 1rem", cursor: "pointer", background: h ? "rgba(4,198,233,0.06)" : "transparent", transition: "background 0.15s" }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>{icon}</span>
                <div style={{ minWidth: 0 }}>
                    <div style={{ color: "rgb(210,235,255)", fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
                    {sub && <div style={{ color: "rgba(130,170,210,0.7)", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
                </div>
            </div>
        );
    };

    return (
        <div ref={boxRef} style={{ position: "absolute", top: "calc(100% + 0.6rem)", right: 0, width: "min(440px, 92vw)", zIndex: 200, background: "rgba(10,14,22,0.97)", border: "1px solid rgba(4,198,233,0.18)", borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(4,198,233,0.04)", overflow: "hidden", backdropFilter: "blur(20px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.8rem 1rem", borderBottom: "1px solid rgba(100,160,220,0.08)" }}>
                <FaSearch style={{ color: "rgba(4,198,233,0.6)", flexShrink: 0, fontSize: "0.85rem" }} />
                <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по сайту…"
                       style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgb(210,235,255)", fontSize: "0.925rem", fontFamily: "inherit" }} />
                {loading && <div style={{ width: 15, height: 15, border: "2px solid rgba(4,198,233,0.15)", borderTop: "2px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />}
                {query && !loading && <button onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }} style={{ background: "none", border: "none", color: "rgba(130,170,210,0.5)", cursor: "pointer", padding: 0, fontSize: "0.85rem", lineHeight: 1, transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = "rgb(180,220,255)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(130,170,210,0.5)"}>✕</button>}
            </div>
            {query && !loading && !has && <div style={{ padding: "1.5rem 1rem", color: "rgba(130,170,210,0.5)", fontSize: "0.875rem", textAlign: "center" }}>Ничего не найдено</div>}
            {has && (
                <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    {results.users?.length > 0 && <><SectionTitle t="Пользователи" />{results.users.map(u => <Row key={u.id} onClick={() => go(`/profile/${u.id}`)} icon="👤" title={u.username} />)}</>}
                    {results.categories?.length > 0 && <><SectionTitle t="Категории" />{results.categories.map(c => <Row key={c.id} onClick={() => go("/blog", { categoryId: c.id })} icon={c.emoji} title={c.name} />)}</>}
                    {results.posts?.length > 0 && <><SectionTitle t="Посты" />{results.posts.map(p => <Row key={p.id} onClick={() => go(`/posts/${p.id}`)} icon="📝" title={p.title} sub={stripHtml(p.content).slice(0, 90)} />)}</>}
                </div>
            )}
        </div>
    );
}

/* ─── иконка-кнопка (40×40, иконка 20px) ───────────────────────── */
function IconBtn({ onClick, active, label, children, as: Tag = "button", to, href }) {
    const [h, setH] = useState(false);
    const style = {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 40, height: 40,
        background: active || h ? "rgba(4,198,233,0.1)" : "transparent",
        border: "1px solid " + (active ? "rgba(4,198,233,0.4)" : h ? "rgba(4,198,233,0.18)" : "transparent"),
        borderRadius: "10px",
        color: active || h ? "var(--logo-color)" : "rgba(160,200,240,0.75)",
        cursor: "pointer", fontSize: "1.1rem", textDecoration: "none",
        transition: "all 0.2s ease",
        transform: h ? "translateY(-2px)" : "translateY(0)",
        flexShrink: 0,
    };
    if (Tag === "a") return <a href={href} style={style} aria-label={label} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{children}</a>;
    if (to) return <Link to={to} style={style} aria-label={label} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{children}</Link>;
    return <button onClick={onClick} aria-label={label} style={style} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{children}</button>;
}

/* ─── аватар с реальным фото ────────────────────────────────────── */
function Avatar({ userId, username, size = 28 }) {
    const initials = (username || "?").slice(0, 2).toUpperCase();
    const hue = Array.from(username || "").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

    const [url, setUrl] = useState(() => {
        const peeked = peekAvatarUrl(userId);
        return peeked !== undefined ? peeked : null;
    });
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const peeked = peekAvatarUrl(userId);
        if (peeked !== undefined) { setUrl(peeked); return; }
        let cancelled = false;
        getCachedAvatarUrl(userId).then(u => {
            if (!cancelled) { setUrl(u); setImgLoaded(false); }
        });
        return () => { cancelled = true; };
    }, [userId]);

    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: `hsl(${hue},55%,32%)`,
            border: "1.5px solid rgba(4,198,233,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.38 + "px", fontWeight: 700, color: "rgb(200,235,255)",
            flexShrink: 0, letterSpacing: "-0.02em",
            overflow: "hidden", position: "relative",
        }}>
            {url && (
                <img src={url} alt={username || "avatar"}
                     onLoad={() => setImgLoaded(true)}
                     style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: imgLoaded ? "block" : "none" }} />
            )}
            {(!url || !imgLoaded) && initials}
        </div>
    );
}

/* ─── профиль-дропдаун ──────────────────────────────────────────── */
function MenuItem({ label, icon, href, onClick }) {
    const [h, setH] = useState(false);
    return (
        <Link to={href} onClick={onClick}
              onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
              style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.55rem 1rem", color: h ? "rgb(200,235,255)" : "rgba(160,200,240,0.8)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, background: h ? "rgba(4,198,233,0.06)" : "transparent", transition: "all 0.15s" }}>
            <span style={{ color: h ? "var(--logo-color)" : "rgba(4,198,233,0.45)", transition: "color 0.15s" }}>{icon}</span>
            {label}
        </Link>
    );
}

function LogoutBtn({ onLogout, onClose }) {
    const [h, setH] = useState(false);
    return (
        <button onClick={() => { onLogout(); onClose(); }}
                onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
                style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", padding: "0.55rem 1rem", color: h ? "rgb(255,110,110)" : "rgba(200,100,100,0.7)", background: h ? "rgba(255,60,60,0.07)" : "transparent", border: "none", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
            <FaSignOutAlt size={13} /> Выйти
        </button>
    );
}

function ProfileMenu({ user, userId, onLogout, onClose }) {
    const menuRef = useRef(null);
    useEffect(() => {
        const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
        const k = e => { if (e.key === "Escape") onClose(); };
        document.addEventListener("mousedown", h);
        document.addEventListener("keydown", k);
        return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
    }, [onClose]);

    return (
        <div ref={menuRef} style={{ position: "absolute", top: "calc(100% + 0.6rem)", right: 0, minWidth: 180, zIndex: 200, background: "rgba(10,14,22,0.97)", border: "1px solid rgba(4,198,233,0.18)", borderRadius: "12px", boxShadow: "0 16px 48px rgba(0,0,0,0.65)", backdropFilter: "blur(20px)", overflow: "hidden", padding: "0.35rem 0" }}>
            <div style={{ padding: "0.65rem 1rem 0.5rem", borderBottom: "1px solid rgba(100,160,220,0.08)", marginBottom: "0.25rem" }}>
                <div style={{ fontSize: "0.7rem", color: "rgba(130,170,210,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Профиль</div>
                <div style={{ fontWeight: 700, fontSize: "0.925rem", color: "rgb(200,235,255)" }}>@{user.username}</div>
            </div>
            <MenuItem label="Мой профиль" icon={<FaUserCircle size={14} />} href={`/profile/${userId}`} onClick={onClose} />
            <MenuItem label="Настройки"   icon={<HiOutlineCog6Tooth size={14} />} href="/settings" onClick={onClose} />
            <div style={{ height: 1, background: "rgba(100,160,220,0.08)", margin: "0.25rem 0" }} />
            <LogoutBtn onLogout={onLogout} onClose={onClose} />
        </div>
    );
}

/* ─── HEADER ────────────────────────────────────────────────────── */
function Header() {
    const { user, logoutUser } = useContext(AuthContext);
    const location = useLocation();
    const [menuOpen,    setMenuOpen]    = useState(false);
    const [searchOpen,  setSearchOpen]  = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [visible,     setVisible]     = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const cur = window.scrollY;
            if (cur < 200)                        setVisible(true);
            else if (cur < lastScrollY.current)   setVisible(true);
            else if (cur > lastScrollY.current + 4) setVisible(false);
            lastScrollY.current = cur;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const getIsSuperuser = () => {
        const t = localStorage.getItem("access_token");
        if (!t) return false;
        try { return JSON.parse(atob(t.split(".")[1])).is_superuser === true; } catch { return false; }
    };
    const getMyId = () => {
        const t = localStorage.getItem("access_token");
        if (!t) return null;
        try { return JSON.parse(atob(t.split(".")[1])).sub; } catch { return null; }
    };

    const close = () => { setMenuOpen(false); setProfileOpen(false); setSearchOpen(false); };
    const closeSearch  = useCallback(() => setSearchOpen(false), []);
    const closeProfile = useCallback(() => setProfileOpen(false), []);

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { to: "/",        label: "Домой" },
        { to: "/blog",    label: "Блог" },
        { to: "/about",   label: "О себе" },
        { to: "/contact", label: "Контакты" },
    ];

    return (
        <>
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes fadeIn  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

                /* ── корень ── */
                .hdr-root {
                    position: sticky; top: 0; z-index: 100;
                    height: 64px;
                    background: rgba(9, 12, 20, 0.78);
                    backdrop-filter: blur(18px) saturate(160%);
                    -webkit-backdrop-filter: blur(18px) saturate(160%);
                    border-bottom: 1px solid rgba(4,198,233,0.08);
                    box-shadow: 0 1px 0 rgba(4,198,233,0.04), 0 4px 24px rgba(0,0,0,0.3);
                    transition: transform 0.3s ease;
                }

                /* ── сетка ── */
                .hdr-inner {
                    max-width: 1400px; margin: 0 auto; height: 100%;
                    display: grid;
                    grid-template-columns: 0.7fr 2fr 1.5fr;
                    align-items: center;
                    padding: 0 2rem; gap: 1rem;
                }

                /* ── лого ── */
                .hdr-logo {
                    font-weight: 800; font-size: 1.2rem; letter-spacing: -0.02em;
                    text-decoration: none; white-space: nowrap; flex-shrink: 0;
                    background: linear-gradient(135deg, rgb(180,255,255) 0%, rgb(4,198,233) 60%, rgb(100,180,255) 100%);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 12px rgba(4,198,233,0.25));
                    transition: filter 0.2s ease;
                }
                .hdr-logo:hover { filter: drop-shadow(0 0 20px rgba(4,198,233,0.55)); }

                /* ── навигация ── */
                .hdr-nav {
                    display: flex; align-items: center;
                    justify-content: center; gap: 0.25rem;
                }

                .hdr-link {
                    position: relative;
                    font-weight: 500; font-size: 0.9rem;
                    text-decoration: none;
                    color: rgba(160, 200, 240, 0.7);
                    padding: 0.4rem 0.85rem;
                    border-radius: 8px;
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                .hdr-link:hover {
                    color: rgb(210, 240, 255);
                    background: rgba(4,198,233,0.06);
                    border-color: rgba(4,198,233,0.12);
                }
                .hdr-link.active {
                    color: rgb(180, 240, 255);
                    font-weight: 600;
                }
                /* светящийся индикатор активного пункта */
                .hdr-link.active::after {
                    content: '';
                    position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%);
                    width: 60%; height: 2px;
                    background: linear-gradient(90deg, transparent, var(--logo-color), transparent);
                    border-radius: 2px;
                    box-shadow: 0 0 8px rgba(4,198,233,0.8);
                }

                /* ── правая панель ── */
                .hdr-right {
                    display: flex; align-items: center;
                    gap: 0.2rem; justify-content: flex-end;
                }

                /* Разделитель */
                .hdr-divider {
                    width: 1px; height: 22px;
                    background: rgba(100,160,220,0.12);
                    flex-shrink: 0; margin: 0 0.35rem;
                }

                /* Группа иконок */
                .hdr-icons {
                    display: flex; align-items: center; gap: 0.15rem;
                }

                /* ── обёртка колокольчика ── */
                .hdr-bell-wrap > * { display: flex !important; align-items: center !important; justify-content: center !important; }
                .hdr-bell-wrap button {
                    width: 40px !important; height: 40px !important;
                    padding: 0 !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: transparent !important;
                    border: 1px solid transparent !important;
                    border-radius: 10px !important;
                    color: rgba(160,200,240,0.75) !important;
                    font-size: 1.1rem !important;
                    transition: all 0.2s ease !important;
                }
                .hdr-bell-wrap button:hover {
                    background: rgba(4,198,233,0.1) !important;
                    border-color: rgba(4,198,233,0.18) !important;
                    color: var(--logo-color) !important;
                    transform: translateY(-2px) !important;
                }

                /* ── кнопка профиля ── */
                .hdr-profile-btn {
                    display: flex; align-items: center; gap: 0.55rem;
                    padding: 0.3rem 0.65rem 0.3rem 0.35rem;
                    background: rgba(4,198,233,0.05);
                    border: 1px solid rgba(4,198,233,0.18);
                    border-radius: 50px;
                    cursor: pointer; text-decoration: none;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                .hdr-profile-btn:hover {
                    background: rgba(4,198,233,0.12);
                    border-color: rgba(4,198,233,0.38);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(4,198,233,0.12);
                }
                .hdr-profile-name {
                    font-weight: 600; font-size: 0.875rem;
                    color: rgb(200,235,255);
                }

                /* ── меню для незалогиненных ── */
                .hdr-auth-link {
                    display: flex; align-items: center; gap: 0.4rem;
                    font-weight: 600; font-size: 0.875rem;
                    text-decoration: none; padding: 0.4rem 0.9rem;
                    border-radius: 8px; white-space: nowrap;
                    transition: all 0.2s ease;
                }
                .hdr-auth-login {
                    color: rgba(160,200,240,0.75);
                    border: 1px solid transparent;
                }
                .hdr-auth-login:hover {
                    color: rgb(210,240,255);
                    background: rgba(4,198,233,0.06);
                    border-color: rgba(4,198,233,0.12);
                }
                .hdr-auth-reg {
                    color: rgb(10,20,30);
                    background: linear-gradient(135deg, var(--logo-color), rgb(100,210,255));
                    border: 1px solid transparent;
                }
                .hdr-auth-reg:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(4,198,233,0.3);
                }

                /* ── бургер ── */
                .hdr-burger {
                    display: none;
                    background: rgba(4,198,233,0.05);
                    border: 1px solid rgba(4,198,233,0.15);
                    border-radius: 9px;
                    color: rgba(160,200,240,0.8);
                    font-size: 1rem; cursor: pointer;
                    padding: 0.45rem 0.55rem; line-height: 1;
                    transition: all 0.2s ease;
                }
                .hdr-burger:hover { background: rgba(4,198,233,0.1); border-color: rgba(4,198,233,0.3); color: var(--logo-color); }

                /* ── мобилки ── */
                @media (max-width: 820px) {
                    .hdr-inner { grid-template-columns: 1fr auto; }
                    .hdr-burger { display: flex; align-items: center; }
                    .hdr-nav, .hdr-right { display: none; }

                    .hdr-mobile-nav {
                        display: flex; flex-direction: column; gap: 0.15rem;
                        position: fixed; top: 0; right: 0;
                        width: 72vw; max-width: 300px; height: 100vh;
                        background: rgba(8,11,20,0.98);
                        backdrop-filter: blur(20px);
                        border-left: 1px solid rgba(4,198,233,0.1);
                        padding: 5rem 1rem 2rem;
                        z-index: 999;
                        box-shadow: -12px 0 40px rgba(0,0,0,0.5);
                        overflow-y: auto;
                        animation: fadeIn 0.2s ease;
                    }
                    .hdr-mobile-nav .hdr-link {
                        font-size: 1rem; padding: 0.7rem 0.9rem;
                        border-radius: 10px; border: 1px solid transparent;
                        color: rgba(160,200,240,0.8);
                    }
                    .hdr-mobile-nav .hdr-link.active {
                        background: rgba(4,198,233,0.08);
                        border-color: rgba(4,198,233,0.15);
                        color: rgb(180,240,255);
                    }
                    .hdr-mobile-nav .hdr-link.active::after { display: none; }
                }
            `}</style>

            <header className="hdr-root" style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}>
                <div className="hdr-inner">

                    {/* Лого */}
                    <Link to="/" className="hdr-logo" onClick={close}>zerw1337's website</Link>

                    {/* Навигация */}
                    <nav className="hdr-nav">
                        {navItems.map(({ to, label }) => (
                            <Link key={to} to={to} onClick={close}
                                  className={"hdr-link" + (isActive(to) ? " active" : "")}>
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Правая панель */}
                    <div className="hdr-right">

                        {/* Поиск */}
                        <div style={{ position: "relative" }}>
                            <IconBtn onClick={() => { setSearchOpen(o => !o); setProfileOpen(false); }} active={searchOpen} label="Поиск">
                                <FaSearch size={16} />
                            </IconBtn>
                            {searchOpen && <SearchBox onClose={closeSearch} />}
                        </div>

                        {user ? (
                            <>
                                {/* Иконки */}
                                <div className="hdr-icons">
                                    <div className="hdr-bell-wrap">
                                        <NotificationBell onClose={close} />
                                    </div>

                                    <IconBtn to="/messages" label="Сообщения">
                                        <FaEnvelope size={16} />
                                    </IconBtn>

                                    {getIsSuperuser() && (
                                        <IconBtn to="/admin" label="Админ">
                                            <HiOutlineCog6Tooth size={18} />
                                        </IconBtn>
                                    )}
                                </div>

                                <div className="hdr-divider" />

                                {/* Кнопка профиля с аватаром */}
                                <div style={{ position: "relative" }}>
                                    <button
                                        className="hdr-profile-btn"
                                        onClick={() => { setProfileOpen(o => !o); setSearchOpen(false); }}
                                    >
                                        <Avatar userId={getMyId()} username={user.username} size={26} />
                                        <span className="hdr-profile-name">{user.username}</span>
                                        <svg width="10" height="10" viewBox="0 0 10 10" style={{ color: "rgba(4,198,233,0.45)", transition: "transform 0.2s", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                                            <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                                        </svg>
                                    </button>

                                    {profileOpen && (
                                        <ProfileMenu
                                            user={user}
                                            userId={getMyId()}
                                            onLogout={logoutUser}
                                            onClose={closeProfile}
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login"    className="hdr-auth-link hdr-auth-login" onClick={close}>
                                    <FaSignInAlt size={13} /> Войти
                                </Link>
                                <Link to="/register" className="hdr-auth-link hdr-auth-reg" onClick={close}>
                                    <FaUser size={12} /> Регистрация
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Бургер */}
                    <button className="hdr-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Меню">
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </header>

            {/* Мобильное меню */}
            {menuOpen && (
                <>
                    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />
                    <nav className="hdr-mobile-nav">
                        {navItems.map(({ to, label }) => (
                            <Link key={to} to={to} onClick={close}
                                  className={"hdr-link" + (isActive(to) ? " active" : "")}>
                                {label}
                            </Link>
                        ))}
                        {user ? (
                            <>
                                <div style={{ height: 1, background: "rgba(100,160,220,0.08)", margin: "0.5rem 0" }} />
                                <Link to="/messages" className="hdr-link" onClick={close}>✉ Сообщения</Link>
                                {getIsSuperuser() && <Link to="/admin" className="hdr-link" onClick={close}>⚙ Админ</Link>}
                                <Link to={`/profile/${getMyId()}`} className="hdr-link" onClick={close}>👤 Мой профиль</Link>
                                <button onClick={() => { logoutUser(); close(); }}
                                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "rgba(200,100,100,0.8)", fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", padding: "0.7rem 0.9rem", borderRadius: 10, width: "100%", textAlign: "left" }}>
                                    <FaSignOutAlt size={13} /> Выйти
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{ height: 1, background: "rgba(100,160,220,0.08)", margin: "0.5rem 0" }} />
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