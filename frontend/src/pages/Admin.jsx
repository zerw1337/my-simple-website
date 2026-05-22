import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    getCategories, getAllPosts, createPost, createCategory,
    deleteCategory, deletePost, updatePost, getAllUsers, banUser, unbanUser
} from "../api/Posts";
import { createCustomNotification } from "../api/Notifications";
import PostEditor from "../components/PostEditor";

const MAX_IMAGES = 10;

function Admin() {
    const navigate = useNavigate();

    const isSuperuser = (() => {
        const token = localStorage.getItem("access_token");
        if (!token) return false;
        try { return JSON.parse(atob(token.split(".")[1])).is_superuser === true; } catch { return false; }
    })();

    const [activeTab, setActiveTab] = useState("posts");
    const [categories, setCategories] = useState([]);
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");
    const [postCategory, setPostCategory] = useState("");
    const [postImages, setPostImages] = useState([]);
    const [postPreviews, setPostPreviews] = useState([]);
    const [postLoading, setPostLoading] = useState(false);
    const [postError, setPostError] = useState("");
    const [postSuccess, setPostSuccess] = useState("");
    const fileInputRef = useRef(null);

    const [catName, setCatName] = useState("");
    const [catEmoji, setCatEmoji] = useState("");
    const [catDesc, setCatDesc] = useState("");
    const [catLoading, setCatLoading] = useState(false);
    const [catError, setCatError] = useState("");
    const [catSuccess, setCatSuccess] = useState("");

    const [editingPost, setEditingPost] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");

    const [notifTitle, setNotifTitle] = useState("");
    const [notifBody, setNotifBody] = useState("");
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifError, setNotifError] = useState("");
    const [notifSuccess, setNotifSuccess] = useState("");

    useEffect(() => {
        if (!isSuperuser) { navigate("/"); return; }
        loadData();
    }, []);

    useEffect(() => {
        return () => postPreviews.forEach(url => URL.revokeObjectURL(url));
    }, [postPreviews]);

    const loadData = async () => {
        setLoading(true);
        const [cats, ps, us] = await Promise.all([getCategories(), getAllPosts(), getAllUsers()]);
        setCategories(cats);
        setPosts(ps);
        setUsers(us);
        if (cats.length > 0) setPostCategory(cats[0].id);
        setLoading(false);
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const remaining = MAX_IMAGES - postImages.length;
        if (remaining <= 0) return;
        const toAdd = files.slice(0, remaining);
        setPostImages(prev => [...prev, ...toAdd]);
        setPostPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
        e.target.value = "";
    };

    const removeImage = (i) => {
        URL.revokeObjectURL(postPreviews[i]);
        const removedNum = i + 1;
        // Удаляем тег удалённой картинки из текста, сдвигаем остальные
        let updated = postContent.replace(new RegExp(`\\[img:${removedNum}\\]`, "g"), "");
        for (let n = removedNum + 1; n <= postImages.length; n++) {
            updated = updated.replace(new RegExp(`\\[img:${n}\\]`, "g"), `[img:${n - 1}]`);
        }
        setPostContent(updated);
        setPostImages(prev => prev.filter((_, idx) => idx !== i));
        setPostPreviews(prev => prev.filter((_, idx) => idx !== i));
    };

    const handleCreatePost = async () => {
        setPostError(""); setPostSuccess("");
        if (!postTitle.trim()) { setPostError("Введите заголовок"); return; }
        if (!postContent.trim()) { setPostError("Введите содержимое"); return; }
        if (!postCategory) { setPostError("Выберите категорию"); return; }
        setPostLoading(true);
        try {
            await createPost(postTitle.trim(), postContent.trim(), parseInt(postCategory), postImages);
            setPostSuccess("Пост создан!");
            setPostTitle(""); setPostContent("");
            postPreviews.forEach(url => URL.revokeObjectURL(url));
            setPostImages([]); setPostPreviews([]);
            await loadData();
        } catch (e) { setPostError(e.message); }
        finally { setPostLoading(false); }
    };

    const handleCreateCategory = async () => {
        setCatError(""); setCatSuccess("");
        if (!catName.trim()) { setCatError("Введите название"); return; }
        setCatLoading(true);
        try {
            await createCategory(catName.trim(), catEmoji.trim(), catDesc.trim());
            setCatSuccess("Категория создана!");
            setCatName(""); setCatEmoji(""); setCatDesc("");
            await loadData();
        } catch (e) { setCatError(e.message); }
        finally { setCatLoading(false); }
    };

    const handleDeletePost = async (id) => {
        if (!confirm("Удалить пост?")) return;
        try { await deletePost(id); await loadData(); } catch (e) { alert(e.message); }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm("Удалить категорию?")) return;
        try { await deleteCategory(id); await loadData(); } catch (e) { alert(e.message); }
    };

    const handleBanUser = async (id) => {
        if (!confirm("Забанить пользователя?")) return;
        try { await banUser(id); await loadData(); } catch (e) { alert(e.message); }
    };

    const handleUnbanUser = async (id) => {
        if (!confirm("Разбанить пользователя?")) return;
        try { await unbanUser(id); await loadData(); } catch (e) { alert(e.message); }
    };

    const handleCreateNotification = async () => {
        setNotifError(""); setNotifSuccess("");
        if (!notifTitle.trim()) { setNotifError("Введите заголовок"); return; }
        if (!notifBody.trim()) { setNotifError("Введите текст"); return; }
        setNotifLoading(true);
        try {
            await createCustomNotification(notifTitle.trim(), notifBody.trim());
            setNotifSuccess("Уведомление отправлено всем пользователям!");
            setNotifTitle(""); setNotifBody("");
        } catch (e) { setNotifError(e.message); }
        finally { setNotifLoading(false); }
    };

    const handleUpdatePost = async () => {
        setEditError("");
        if (!editingPost.title.trim()) { setEditError("Введите заголовок"); return; }
        if (!editingPost.content.trim()) { setEditError("Введите содержимое"); return; }
        setEditLoading(true);
        try {
            await updatePost(editingPost.id, editingPost.title, editingPost.content, editingPost.category_id);
            setEditingPost(null);
            await loadData();
        } catch (e) { setEditError(e.message); }
        finally { setEditLoading(false); }
    };

    const inputStyle = { width: "100%", padding: "0.5rem 0.75rem", background: "#2a2a2a", border: "1px solid #444", borderRadius: "6px", color: "var(--main-text-color)", fontSize: "1rem", outline: "none", boxSizing: "border-box", fontFamily: "'Poppins', sans-serif", transition: "border-color 0.2s" };
    const labelStyle = { fontWeight: 600, marginTop: "0.75rem", marginBottom: "0.25rem", display: "block", fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", color: "#a0a0a0" };
    const btnStyle = { padding: "0.5rem 1.5rem", background: "var(--logo-color)", color: "var(--bg-main)", border: "none", borderRadius: "6px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", cursor: "pointer", transition: "background 0.2s", marginTop: "1rem" };
    const tabStyle = (active) => ({ padding: "0.5rem 1.5rem", borderRadius: "6px", border: "1px solid " + (active ? "var(--logo-color)" : "#444"), background: active ? "var(--logo-color)" : "transparent", color: active ? "var(--bg-main)" : "#a0a0a0", fontFamily: "'Poppins', sans-serif", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" });
    const actionBtnStyle = { background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Poppins', sans-serif", transition: "color 0.2s", whiteSpace: "nowrap", padding: 0 };

    if (loading) return (
        <main>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
                <div style={{ width: "48px", height: "48px", border: "4px solid #333", borderTop: "4px solid var(--logo-color)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </main>
    );

    return (
        <main>
            <div style={{ maxWidth: "900px", margin: "2rem auto" }}>
                <h2 style={{ marginBottom: "1.5rem" }}>Панель администратора</h2>

                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
                    <button style={tabStyle(activeTab === "posts")} onClick={() => setActiveTab("posts")}>{"Посты (" + posts.length + ")"}</button>
                    <button style={tabStyle(activeTab === "categories")} onClick={() => setActiveTab("categories")}>{"Категории (" + categories.length + ")"}</button>
                    <button style={tabStyle(activeTab === "users")} onClick={() => setActiveTab("users")}>{"Пользователи (" + users.length + ")"}</button>
                    <button style={tabStyle(activeTab === "notifications")} onClick={() => setActiveTab("notifications")}>Уведомления</button>
                </div>

                {/* ── ПОСТЫ ── */}
                {activeTab === "posts" && (
                    <div>
                        <div style={{ background: "#1f1f1f", borderRadius: "12px", padding: "1.5rem 2rem", marginBottom: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                            <h3 style={{ margin: "0 0 1rem" }}>Новый пост</h3>

                            {postError && <div style={{ color: "#ff5555", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{postError}</div>}
                            {postSuccess && <div style={{ color: "#55cc55", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{postSuccess}</div>}

                            <label style={labelStyle}>Заголовок</label>
                            <input style={inputStyle} value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Заголовок поста"
                                   onFocus={e => e.target.style.borderColor = "var(--logo-color)"} onBlur={e => e.target.style.borderColor = "#444"} />

                            <label style={labelStyle}>Категория</label>
                            <select style={{ ...inputStyle, cursor: "pointer" }} value={postCategory} onChange={e => setPostCategory(e.target.value)}>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.emoji + " " + cat.name}</option>)}
                            </select>

                            {/* Картинки — ПЕРЕД редактором, чтобы [img:N] кнопки были активны */}
                            <label style={labelStyle}>
                                Изображения
                                <span style={{ color: "#555", fontWeight: 400, marginLeft: "0.5rem" }}>({postImages.length}/{MAX_IMAGES})</span>
                            </label>

                            {postPreviews.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                    {postPreviews.map((url, i) => (
                                        <div key={i} style={{ position: "relative", width: "90px", height: "90px" }}>
                                            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px", border: "1px solid #444" }} />
                                            {/* Номер = position */}
                                            <div style={{ position: "absolute", top: "-6px", left: "-6px", background: "var(--logo-color)", color: "#000", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {i + 1}
                                            </div>
                                            <button onClick={() => removeImage(i)} style={{ position: "absolute", top: "3px", right: "3px", background: "rgba(0,0,0,0.75)", border: "none", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {postImages.length < MAX_IMAGES && (
                                <>
                                    <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageSelect} />
                                    <button onClick={() => fileInputRef.current?.click()}
                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 1rem", background: "transparent", border: "1px dashed #555", color: "#888", borderRadius: "6px", fontFamily: "'Poppins', sans-serif", fontSize: "0.875rem", cursor: "pointer", transition: "all 0.2s", marginBottom: "0.75rem" }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--logo-color)"; e.currentTarget.style.color = "var(--logo-color)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#888"; }}>
                                        + Добавить фото
                                    </button>
                                </>
                            )}

                            <label style={labelStyle}>Содержимое</label>
                            <PostEditor
                                value={postContent}
                                onChange={setPostContent}
                                images={postImages}
                                placeholder="Содержимое поста..."
                                rows={14}
                            />

                            <button style={btnStyle} disabled={postLoading} onClick={handleCreatePost}
                                    onMouseEnter={e => { if (!postLoading) e.currentTarget.style.background = "#03b0d0"; }}
                                    onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}>
                                {postLoading ? "..." : "Опубликовать"}
                            </button>
                        </div>

                        <h3 style={{ marginBottom: "1rem" }}>Все посты</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {posts.map(post => (
                                <div key={post.id} style={{ background: "#1f1f1f", border: "1px solid #333", borderRadius: "8px", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <a href={"/posts/" + post.id} style={{ fontWeight: 600, color: "var(--main-text-color)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                           onMouseEnter={e => e.currentTarget.style.color = "var(--logo-color)"}
                                           onMouseLeave={e => e.currentTarget.style.color = "var(--main-text-color)"}>
                                            {post.title}
                                        </a>
                                        <span style={{ fontSize: "0.8rem", color: "#a0a0a0" }}>{post.category?.emoji + " " + post.category?.name + " · " + new Date(post.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                        <button onClick={() => setEditingPost({ id: post.id, title: post.title, content: post.content, category_id: post.category?.id })}
                                                style={{ ...actionBtnStyle, color: "#666" }}
                                                onMouseEnter={e => e.currentTarget.style.color = "var(--logo-color)"}
                                                onMouseLeave={e => e.currentTarget.style.color = "#666"}>редактировать</button>
                                        <button onClick={() => handleDeletePost(post.id)}
                                                style={{ ...actionBtnStyle, color: "#666" }}
                                                onMouseEnter={e => e.currentTarget.style.color = "#ff5555"}
                                                onMouseLeave={e => e.currentTarget.style.color = "#666"}>удалить</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── КАТЕГОРИИ ── */}
                {activeTab === "categories" && (
                    <div>
                        <div style={{ background: "#1f1f1f", borderRadius: "12px", padding: "1.5rem 2rem", marginBottom: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                            <h3 style={{ margin: "0 0 1rem" }}>Новая категория</h3>
                            {catError && <div style={{ color: "#ff5555", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{catError}</div>}
                            {catSuccess && <div style={{ color: "#55cc55", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{catSuccess}</div>}
                            <label style={labelStyle}>Название</label>
                            <input style={inputStyle} value={catName} onChange={e => setCatName(e.target.value)} placeholder="Название категории"
                                   onFocus={e => e.target.style.borderColor = "var(--logo-color)"} onBlur={e => e.target.style.borderColor = "#444"} />
                            <label style={labelStyle}>Эмодзи</label>
                            <input style={inputStyle} value={catEmoji} onChange={e => setCatEmoji(e.target.value)} placeholder="💭"
                                   onFocus={e => e.target.style.borderColor = "var(--logo-color)"} onBlur={e => e.target.style.borderColor = "#444"} />
                            <label style={labelStyle}>Описание</label>
                            <input style={inputStyle} value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Краткое описание"
                                   onFocus={e => e.target.style.borderColor = "var(--logo-color)"} onBlur={e => e.target.style.borderColor = "#444"} />
                            <button style={btnStyle} disabled={catLoading} onClick={handleCreateCategory}
                                    onMouseEnter={e => { if (!catLoading) e.currentTarget.style.background = "#03b0d0"; }}
                                    onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}>
                                {catLoading ? "..." : "Создать"}
                            </button>
                        </div>
                        <h3 style={{ marginBottom: "1rem" }}>Все категории</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {categories.map(cat => (
                                <div key={cat.id} style={{ background: "#1f1f1f", border: "1px solid #333", borderRadius: "8px", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{cat.emoji + " " + cat.name}</span>
                                        <span style={{ fontSize: "0.85rem", color: "#a0a0a0", marginLeft: "0.75rem" }}>{cat.description}</span>
                                    </div>
                                    <button onClick={() => handleDeleteCategory(cat.id)} style={{ ...actionBtnStyle, color: "#666" }}
                                            onMouseEnter={e => e.currentTarget.style.color = "#ff5555"}
                                            onMouseLeave={e => e.currentTarget.style.color = "#666"}>удалить</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── ПОЛЬЗОВАТЕЛИ ── */}
                {activeTab === "users" && (
                    <div>
                        <h3 style={{ marginBottom: "1rem" }}>Все пользователи</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {users.map(u => (
                                <div key={u.id} style={{ background: "#1f1f1f", border: "1px solid " + (u.is_banned ? "#ff5555" : "#333"), borderRadius: "8px", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", opacity: u.is_banned ? 0.6 : 1 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                                            <a href={"/profile/" + u.id} style={{ fontWeight: 600, color: "var(--main-text-color)", textDecoration: "none" }}
                                               onMouseEnter={e => e.currentTarget.style.color = "var(--logo-color)"}
                                               onMouseLeave={e => e.currentTarget.style.color = "var(--main-text-color)"}>{u.username}</a>
                                            {u.is_superuser && <span style={{ fontSize: "0.7rem", background: "var(--logo-color)", color: "var(--bg-main)", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>ADMIN</span>}
                                            {u.is_banned && <span style={{ fontSize: "0.7rem", background: "#ff5555", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>БАН</span>}
                                            {!u.is_verified && <span style={{ fontSize: "0.7rem", background: "#666", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>НЕ ВЕРИФИЦИРОВАН</span>}
                                        </div>
                                        <span style={{ fontSize: "0.8rem", color: "#a0a0a0" }}>{u.email + " · " + new Date(u.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}>
                                        {!u.is_banned && !u.is_superuser && (
                                            <button onClick={() => handleBanUser(u.id)} style={{ ...actionBtnStyle, color: "#666" }}
                                                    onMouseEnter={e => e.currentTarget.style.color = "#ff5555"}
                                                    onMouseLeave={e => e.currentTarget.style.color = "#666"}>забанить</button>
                                        )}
                                        {u.is_banned && (
                                            <button onClick={() => handleUnbanUser(u.id)} style={{ ...actionBtnStyle, color: "#666" }}
                                                    onMouseEnter={e => e.currentTarget.style.color = "#55cc55"}
                                                    onMouseLeave={e => e.currentTarget.style.color = "#666"}>разбанить</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}



            {/* ── УВЕДОМЛЕНИЯ ── */}
            {activeTab === "notifications" && (
                <div>
                    <div style={{ background: "#1f1f1f", borderRadius: "12px", padding: "1.5rem 2rem", marginBottom: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                        <h3 style={{ margin: "0 0 0.5rem" }}>Создать кастомное уведомление</h3>
                        <p style={{ color: "#666", fontSize: "0.875rem", fontFamily: "'Poppins', sans-serif", margin: "0 0 1.25rem" }}>
                            Уведомление будет отправлено всем зарегистрированным пользователям.
                        </p>
                        {notifError && <div style={{ color: "#ff5555", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{notifError}</div>}
                        {notifSuccess && <div style={{ color: "#55cc55", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{notifSuccess}</div>}
                        <label style={labelStyle}>Заголовок</label>
                        <input style={inputStyle} value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Например: Новые функции на сайте!"
                               onFocus={e => e.target.style.borderColor = "var(--logo-color)"} onBlur={e => e.target.style.borderColor = "#444"} />
                        <label style={labelStyle}>Текст уведомления</label>
                        <textarea
                            style={{ ...inputStyle, resize: "vertical", minHeight: "100px", lineHeight: 1.5 }}
                            value={notifBody}
                            onChange={e => setNotifBody(e.target.value)}
                            placeholder="Текст, который увидят все пользователи..."
                            onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                            onBlur={e => e.target.style.borderColor = "#444"}
                        />
                        <button style={btnStyle} disabled={notifLoading} onClick={handleCreateNotification}
                                onMouseEnter={e => { if (!notifLoading) e.currentTarget.style.background = "#03b0d0"; }}
                                onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}>
                            {notifLoading ? "..." : "Отправить всем"}
                        </button>
                    </div>
                </div>
            )}


            {/* ── Модалка редактирования ── */}
            {editingPost && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
                     onClick={() => setEditingPost(null)}>
                    <div style={{ background: "#1f1f1f", borderRadius: "12px", padding: "2rem", width: "100%", maxWidth: "700px", margin: "1rem", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}
                         onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: "0 0 1rem" }}>Редактировать пост</h3>
                        {editError && <div style={{ color: "#ff5555", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{editError}</div>}
                        <label style={labelStyle}>Заголовок</label>
                        <input style={inputStyle} value={editingPost.title}
                               onChange={e => setEditingPost({ ...editingPost, title: e.target.value })}
                               onFocus={e => e.target.style.borderColor = "var(--logo-color)"} onBlur={e => e.target.style.borderColor = "#444"} />
                        <label style={labelStyle}>Категория</label>
                        <select style={{ ...inputStyle, cursor: "pointer" }} value={editingPost.category_id}
                                onChange={e => setEditingPost({ ...editingPost, category_id: parseInt(e.target.value) })}>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.emoji + " " + cat.name}</option>)}
                        </select>
                        <label style={labelStyle}>Содержимое</label>
                        <PostEditor
                            value={editingPost.content}
                            onChange={v => setEditingPost({ ...editingPost, content: v })}
                            images={[]}
                            rows={12}
                        />
                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                            <button style={btnStyle} disabled={editLoading} onClick={handleUpdatePost}
                                    onMouseEnter={e => { if (!editLoading) e.currentTarget.style.background = "#03b0d0"; }}
                                    onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}>
                                {editLoading ? "..." : "Сохранить"}
                            </button>
                            <button onClick={() => setEditingPost(null)} style={{ ...btnStyle, background: "transparent", color: "#666", border: "1px solid #444" }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "#666"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "#444"}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </main>
    );
}

export default Admin;