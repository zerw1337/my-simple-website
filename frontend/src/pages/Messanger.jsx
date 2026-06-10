import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useOnlineStatus } from "../context/OnlineStatusContext.jsx";
import { getMyChats, getChatMessages, getWsUrl } from "../api/Messanger.js";
import { prefetchAvatars } from "../api/avatarCache.js";
import UserAvatar from "../components/UserAvatar.jsx";

/* ---------- helpers ---------- */
function timeAgo(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr + "Z");
    const diff = Date.now() - date.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "только что";
    if (m < 60) return `${m} мин. назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч. назад`;
    return `${Math.floor(h / 24)} д. назад`;
}

function getCurrentUserId() {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    try { return parseInt(JSON.parse(atob(token.split(".")[1])).sub, 10) || null; }
    catch { return null; }
}

/** Сортирует список чатов по дате последнего сообщения (новые вверху). */
function sortChats(chatList) {
    return [...chatList].sort((a, b) => {
        const ta = a.chat.last_message_created_at ? new Date(a.chat.last_message_created_at + "Z") : 0;
        const tb = b.chat.last_message_created_at ? new Date(b.chat.last_message_created_at + "Z") : 0;
        return tb - ta;
    });
}

/** Обновляет запись чата в списке и пересортировывает по дате последнего сообщения. */
function applyLastMessage(chatList, chatUuid, text, createdAt, isActive) {
    const updated = chatList.map(c => {
        if (c.chat.uuid !== chatUuid) return c;
        return {
            ...c,
            chat: { ...c.chat, last_message_text: text, last_message_created_at: createdAt },
            // Увеличиваем счётчик непрочитанных только если чат не активен
            unread_count: isActive ? 0 : (c.unread_count ?? 0) + 1,
        };
    });
    return sortChats(updated);
}

/* ---------- component ---------- */
export default function Messanger() {
    const { user } = useContext(AuthContext);
    const { seedLastSeen, isOnline, getLastSeen } = useOnlineStatus();
    const navigate = useNavigate();
    const location = useLocation();

    const [chats, setChats] = useState([]);
    const [activeChatUuid, setActiveChatUuid] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [wsStatus, setWsStatus] = useState("disconnected");
    const [wsError, setWsError] = useState(null);

    // Карта uuid → WebSocket для ВСЕХ чатов (фоновые + активный).
    // Это позволяет обновлять sidebar даже когда открыт другой чат.
    const allWsRef = useRef({});

    // Ссылка на uuid активного чата (нужна внутри замыканий onmessage).
    const activeChatUuidRef = useRef(null);

    const messagesRef = useRef(null);
    const inputRef = useRef(null);
    const myId = getCurrentUserId();

    // username кеш для WS-сообщений (user_id → username)
    const usernameCache = useRef({});

    /* ---- создать/переиспользовать WS для конкретного чата ---- */
    const ensureChatWs = useCallback((chatUuid) => {
        const existing = allWsRef.current[chatUuid];
        if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
            return existing;
        }

        const ws = new WebSocket(getWsUrl(chatUuid));
        allWsRef.current[chatUuid] = ws;

        ws.onopen = () => {
            if (activeChatUuidRef.current === chatUuid) {
                setWsStatus("open");
                setWsError(null);
            }
        };

        ws.onclose = (e) => {
            delete allWsRef.current[chatUuid];
            if (activeChatUuidRef.current === chatUuid) {
                setWsStatus("disconnected");
                if (e.code !== 1000) setWsError(`Соединение закрыто (код ${e.code})`);
            }
        };

        ws.onerror = () => {
            if (activeChatUuidRef.current === chatUuid) {
                setWsStatus("error");
                setWsError("Не удалось подключиться к чату.");
            }
        };

        ws.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            const isActive = activeChatUuidRef.current === chatUuid;

            if (payload.response_type === "message_created") {
                // Обновляем sidebar: порядок + превью + unread_count
                const isActive = activeChatUuidRef.current === chatUuid;
                setChats(prev => applyLastMessage(prev, chatUuid, payload.message, payload.created_at, isActive));

                // Если это активный чат — добавляем сообщение в ленту
                if (isActive) {
                    const username = usernameCache.current[payload.user_id] ?? null;
                    setMessages(prev => [...prev, {
                        id: payload.message_id,
                        chat_id: null,
                        message: payload.message,
                        created_at: payload.created_at,
                        user: { id: payload.user_id, username },
                    }]);
                }

            } else if (payload.response_type === "message_edited") {
                if (isActive) {
                    setMessages(prev => prev.map(m =>
                        m.id === payload.message_id ? { ...m, message: payload.message } : m
                    ));
                }

            } else if (payload.response_type === "message_deleted") {
                if (isActive) {
                    setMessages(prev => prev.filter(m => m.id !== payload.message_id));
                }
            }
        };

        return ws;
    }, []);

    /* ---- загрузка чатов + предзагрузка аватарок + авто-открытие ---- */
    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        (async () => {
            setLoadingChats(true);
            const data = await getMyChats();
            setChats(sortChats(data));
            setLoadingChats(false);

            if (!Array.isArray(data) || data.length === 0) return;

            // Сидируем last_seen участников в глобальный контекст
            data.forEach(({ other_participant: op }) => {
                if (op?.id && op?.last_seen) seedLastSeen(op.id, op.last_seen);
            });

            // Предзагружаем аватарки всех участников за один проход
            const avatarIds = data
                .map(({ other_participant: op }) => op?.id)
                .filter(Boolean);
            prefetchAvatars([...avatarIds, myId].filter(Boolean));

            // Открываем фоновые WS для всех чатов (для синхронизации sidebar)
            data.forEach(({ chat }) => ensureChatWs(chat.uuid));

            // Открываем чат из state (после createChat) → sessionStorage (после F5) → первый по умолчанию
            const targetUuid = location.state?.openChatUuid
                ?? sessionStorage.getItem("activeChatUuid")
                ?? data[0].chat.uuid;
            const targetEntry = data.find(c => c.chat.uuid === targetUuid) ?? data[0];
            openChatInternal(targetEntry.chat.uuid, targetEntry);
        })();

        return () => {
            // Закрываем все WS при размонтировании компонента
            Object.values(allWsRef.current).forEach(ws => ws.close());
            allWsRef.current = {};
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    /* ---- открыть чат (внутренняя функция, не зависит от activeChatUuid) ---- */
    const openChatInternal = useCallback(async (chatUuid, _chatEntry) => {
        if (activeChatUuidRef.current === chatUuid) return;

        activeChatUuidRef.current = chatUuid;
        setActiveChatUuid(chatUuid);
        sessionStorage.setItem("activeChatUuid", chatUuid);
        setMessages([]);
        setWsError(null);
        setLoadingMessages(true);

        // Сбрасываем счётчик непрочитанных для открываемого чата
        setChats(prev => prev.map(c =>
            c.chat.uuid === chatUuid ? { ...c, unread_count: 0 } : c
        ));

        // Устанавливаем статус WS для нового активного чата
        const existingWs = allWsRef.current[chatUuid];
        if (existingWs) {
            setWsStatus(
                existingWs.readyState === WebSocket.OPEN ? "open" :
                    existingWs.readyState === WebSocket.CONNECTING ? "connecting" : "disconnected"
            );
        } else {
            setWsStatus("connecting");
        }

        try {
            const data = await getChatMessages(chatUuid);
            if (Array.isArray(data)) {
                data.forEach(m => {
                    if (m.user?.id && m.user?.username)
                        usernameCache.current[m.user.id] = m.user.username;
                });
                setMessages(data);
            }
        } catch { setMessages([]); }
        setLoadingMessages(false);

        // Создаём WS если ещё нет (уже могли создать в ensureChatWs при загрузке)
        ensureChatWs(chatUuid);
    }, [ensureChatWs]);

    /* ---- публичный обработчик клика по чату ---- */
    const openChat = useCallback((chatUuid) => {
        openChatInternal(chatUuid);
    }, [openChatInternal]);

    /* ---- авто-скролл вниз ---- */
    useEffect(() => {
        if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }, [messages]);

    /* ---- отправка / редактирование / удаление ---- */
    const sendMessage = () => {
        const ws = allWsRef.current[activeChatUuid];
        if (!inputText.trim() || ws?.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: "new_message", message: inputText.trim() }));
        setInputText("");
        inputRef.current?.focus();
    };

    const submitEdit = (msgId) => {
        const ws = allWsRef.current[activeChatUuid];
        if (!editText.trim() || ws?.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: "edit_message", message_id: msgId, message: editText.trim() }));
        setEditingId(null);
        setEditText("");
    };

    const deleteMsg = (msgId) => {
        const ws = allWsRef.current[activeChatUuid];
        if (ws?.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: "delete_message", message_id: msgId }));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const wsColor = wsStatus === "open" ? "#04c6e9" : wsStatus === "connecting" ? "#f0a500" : wsStatus === "error" ? "#ff7070" : "#666";
    const activeChat = chats.find(c => c.chat.uuid === activeChatUuid);
    const otherParticipant = activeChat?.other_participant ?? null;
    const activeWsOpen = allWsRef.current[activeChatUuid]?.readyState === WebSocket.OPEN;

    return (
        <main style={{ padding: "2rem var(--body-padding)", flex: 1 }}>
            <h1 style={{ marginBottom: "1.5rem", fontSize: "1.6rem", color: "var(--main-text-color)" }}>
            </h1>

            <div className="msg-layout">
                {/* ===== sidebar ===== */}
                <aside className="msg-sidebar">
                    <div className="msg-sidebar-header">Чаты</div>
                    {loadingChats ? (
                        <div className="msg-empty">Загрузка…</div>
                    ) : chats.length === 0 ? (
                        <div className="msg-empty">Нет чатов</div>
                    ) : (
                        chats.map(({ chat, other_participant: op, unread_count }) => (
                            <button
                                key={chat.uuid}
                                className={`msg-chat-item${activeChatUuid === chat.uuid ? " active" : ""}`}
                                onClick={() => openChat(chat.uuid)}
                            >
                                <div className="msg-chat-row">
                                    <UserAvatar
                                        userId={op?.id}
                                        username={op?.username ?? "?"}
                                        size={36}
                                        profileId={op?.id}
                                    />
                                    <div className="msg-chat-text">
                                        <div className="msg-chat-name-row">
                                            <span className="msg-chat-name" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                                {op?.id && (
                                                    <span style={{
                                                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0, display: "inline-block",
                                                        background: isOnline(op.id) ? "#22c55e" : "transparent",
                                                        border: isOnline(op.id) ? "none" : "none",
                                                    }} />
                                                )}
                                                {op?.username ?? "Неизвестный"}
                                            </span>
                                            {unread_count > 0 && (
                                                <span className="msg-unread-badge">{unread_count > 99 ? "99+" : unread_count}</span>
                                            )}
                                        </div>
                                        {chat.last_message_text && (
                                            <div className="msg-chat-preview">{chat.last_message_text}</div>
                                        )}
                                        {chat.last_message_created_at && (
                                            <div className="msg-chat-time">{timeAgo(chat.last_message_created_at)}</div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </aside>

                {/* ===== chat window ===== */}
                <section className="msg-window">
                    {!activeChatUuid ? (
                        <div className="msg-placeholder">Выберите чат</div>
                    ) : (
                        <>
                            <div className="msg-window-header">
                                {otherParticipant ? (
                                    <>
                                        <UserAvatar userId={otherParticipant.id} username={otherParticipant.username} size={30} style={{ marginRight: 8 }} profileId={otherParticipant.id} />
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                                            <Link
                                                to={`/profile/${otherParticipant.id}`}
                                                style={{ color: "rgb(180,220,255)", fontWeight: 600, textDecoration: "none", lineHeight: 1.2 }}
                                                onMouseEnter={e => e.currentTarget.style.color = "var(--logo-color)"}
                                                onMouseLeave={e => e.currentTarget.style.color = "rgb(180,220,255)"}
                                            >
                                                {otherParticipant.username}
                                            </Link>
                                            <span style={{
                                                fontSize: "0.7rem",
                                                color: isOnline(otherParticipant.id) ? "#22c55e" : "rgb(80,110,140)",
                                                lineHeight: 1,
                                            }}>
                                                {isOnline(otherParticipant.id)
                                                    ? "● В сети"
                                                    : getLastSeen(otherParticipant.id)
                                                        ? `Был(а) ${getLastSeen(otherParticipant.id)}`
                                                        : "Не в сети"
                                                }
                                            </span>
                                        </div>
                                    </>
                                ) : (activeChatUuid.slice(0, 8))}
                                <span
                                    title={`WebSocket: ${wsStatus}`}
                                    style={{
                                        marginLeft: "auto", fontSize: "0.65rem", flexShrink: 0,
                                        color: wsStatus === "open" ? "rgba(4,198,233,0.35)" : "transparent",
                                        transition: "color 0.3s", letterSpacing: "0.05em",
                                        userSelect: "none",
                                    }}
                                >connected</span>
                            </div>

                            {wsError && (
                                <div style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem", color: "#ff7070", background: "rgba(255,80,80,0.07)", borderBottom: "1px solid rgba(255,80,80,0.15)" }}>
                                    ⚠️ {wsError}
                                </div>
                            )}

                            <div className="msg-messages" ref={messagesRef}>
                                {loadingMessages ? (
                                    <div className="msg-empty">Загрузка сообщений…</div>
                                ) : messages.length === 0 ? (
                                    <div className="msg-empty">Нет сообщений. Напишите первым!</div>
                                ) : (
                                    messages.map((m, idx) => {
                                        const msgId = m.id ?? idx;
                                        const isMine = m.user?.id === myId;
                                        const authorId = m.user?.id;
                                        const authorName = m.user?.username ?? usernameCache.current[authorId] ?? "…";
                                        return (
                                            <div key={msgId} className={`msg-row${isMine ? " mine" : ""}`}>
                                                {!isMine && authorId && (
                                                    <div className="msg-avatar-col">
                                                        <UserAvatar userId={authorId} username={authorName} size={28} profileId={authorId} />
                                                    </div>
                                                )}
                                                <div className={`msg-bubble-wrap${isMine ? " mine" : ""}`}>
                                                    {!isMine && (
                                                        <Link
                                                            to={`/profile/${authorId}`}
                                                            className="msg-author-link"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            {authorName}
                                                        </Link>
                                                    )}
                                                    {editingId === msgId ? (
                                                        <div className="msg-edit-wrap">
                                                            <textarea
                                                                className="msg-edit-input"
                                                                value={editText}
                                                                onChange={e => setEditText(e.target.value)}
                                                                autoFocus
                                                                onKeyDown={e => {
                                                                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(msgId); }
                                                                    if (e.key === "Escape") { setEditingId(null); setEditText(""); }
                                                                }}
                                                            />
                                                            <div className="msg-edit-actions">
                                                                <button className="msg-btn-save" onClick={() => submitEdit(msgId)}>Сохранить</button>
                                                                <button className="msg-btn-cancel" onClick={() => { setEditingId(null); setEditText(""); }}>Отмена</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="msg-bubble">
                                                            <span className="msg-text">{m.message}</span>
                                                            <span className="msg-meta">{timeAgo(m.created_at)}</span>
                                                            {isMine && (
                                                                <div className="msg-actions">
                                                                    <button className="msg-act-btn" title="Редактировать" onClick={() => { setEditingId(msgId); setEditText(m.message); }}>✏️</button>
                                                                    <button className="msg-act-btn" title="Удалить" onClick={() => deleteMsg(msgId)}>🗑️</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {isMine && (
                                                    <div className="msg-avatar-col right">
                                                        <UserAvatar userId={myId} username={user?.username ?? ""} size={28} profileId={myId} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="msg-input-row">
                                <textarea
                                    ref={inputRef}
                                    className="msg-input"
                                    placeholder="Написать сообщение… (Enter — отправить)"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                    disabled={!activeWsOpen}
                                />
                                <button className="msg-send-btn" onClick={sendMessage} disabled={!activeWsOpen || !inputText.trim()} title="Отправить">➤</button>
                            </div>
                        </>
                    )}
                </section>
            </div>

            <style>{`
                .msg-layout {
                    display: flex; height: calc(100vh - 220px); min-height: 420px;
                    border: 1px solid rgba(4,198,233,0.15); border-radius: 14px;
                    overflow: hidden; background: #161b24;
                }
                .msg-sidebar {
                    width: 290px; min-width: 200px;
                    border-right: 1px solid rgba(4,198,233,0.1);
                    display: flex; flex-direction: column; overflow-y: auto;
                    scrollbar-width: thin; scrollbar-color: rgba(4,198,233,0.2) transparent;
                }
                .msg-sidebar-header {
                    padding: 1rem 1.1rem 0.75rem; font-size: 0.75rem; font-weight: 700;
                    letter-spacing: 0.12em; text-transform: uppercase;
                    color: rgba(4,198,233,0.7); border-bottom: 1px solid rgba(4,198,233,0.1);
                    flex-shrink: 0; position: sticky; top: 0; background: #161b24; z-index: 1;
                }
                .msg-chat-item {
                    width: 100%; background: none; border: none; text-align: left;
                    padding: 0.7rem 0.9rem; cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    color: var(--main-text-color); transition: background 0.15s;
                }
                .msg-chat-item:hover { background: rgba(4,198,233,0.06); }
                .msg-chat-item.active { background: rgba(4,198,233,0.12); }
                .msg-chat-row { display: flex; align-items: center; gap: 10px; }
                .msg-chat-text { flex: 1; min-width: 0; }
                .msg-chat-name-row {
                    display: flex; align-items: center; justify-content: space-between; gap: 6px;
                }
                .msg-chat-name {
                    font-weight: 600; font-size: 0.88rem; color: rgb(210,240,255);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
                }
                .msg-unread-badge {
                    flex-shrink: 0;
                    background: var(--logo-color, #04c6e9); color: #0a0f18;
                    font-size: 0.68rem; font-weight: 700; line-height: 1;
                    border-radius: 10px; padding: 2px 6px; min-width: 18px;
                    text-align: center;
                }
                .msg-chat-preview {
                    font-size: 0.76rem; color: rgba(200,220,240,0.5);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;
                }
                .msg-chat-time { font-size: 0.7rem; color: rgba(150,170,190,0.4); margin-top: 2px; }

                .msg-window { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .msg-window-header {
                    padding: 0.75rem 1.25rem; border-bottom: 1px solid rgba(4,198,233,0.1);
                    font-size: 0.9rem; color: rgb(180,220,255); flex-shrink: 0;
                    display: flex; align-items: center;
                }
                .msg-placeholder {
                    flex: 1; display: flex; align-items: center; justify-content: center;
                    color: rgba(150,170,190,0.35); font-size: 0.95rem; letter-spacing: 0.04em;
                }
                .msg-empty {
                    padding: 1.25rem; color: rgba(150,170,190,0.4);
                    font-size: 0.85rem; text-align: center;
                }
                .msg-messages {
                    flex: 1; overflow-y: auto; padding: 1rem 1.25rem;
                    display: flex; flex-direction: column; gap: 0.4rem;
                    scrollbar-width: thin; scrollbar-color: rgba(4,198,233,0.2) transparent;
                }

                .msg-row {
                    display: flex; align-items: flex-end; gap: 6px;
                    align-self: flex-start; max-width: 75%;
                }
                .msg-row.mine { align-self: flex-end; flex-direction: row-reverse; }
                .msg-avatar-col { flex-shrink: 0; }
                .msg-bubble-wrap {
                    display: flex; flex-direction: column; align-items: flex-start;
                }
                .msg-bubble-wrap.mine { align-items: flex-end; }
                .msg-author-link {
                    font-size: 0.72rem; font-weight: 600; color: rgba(4,198,233,0.65);
                    text-decoration: none; margin-bottom: 2px; padding-left: 2px;
                    transition: color 0.15s;
                }
                .msg-author-link:hover { color: var(--logo-color); }
                .msg-bubble {
                    position: relative; background: rgba(30,40,55,0.85);
                    border: 1px solid rgba(4,198,233,0.1); border-radius: 12px;
                    padding: 0.5rem 0.8rem 0.45rem;
                    display: inline-flex; flex-direction: column; gap: 3px;
                }
                .msg-bubble-wrap.mine .msg-bubble {
                    background: rgba(4,60,75,0.7); border-color: rgba(4,198,233,0.22);
                }
                .msg-text { font-size: 0.9rem; line-height: 1.45; color: rgb(220,235,250); word-break: break-word; white-space: pre-wrap; }
                .msg-meta { font-size: 0.68rem; color: rgba(150,170,190,0.45); align-self: flex-end; }
                .msg-actions { display: none; gap: 4px; position: absolute; top: -10px; right: 4px; }
                .msg-bubble:hover .msg-actions { display: flex; }
                .msg-act-btn {
                    background: rgba(20,30,45,0.95); border: 1px solid rgba(4,198,233,0.2);
                    border-radius: 6px; padding: 2px 5px; cursor: pointer;
                    font-size: 0.78rem; line-height: 1; transition: background 0.15s;
                }
                .msg-act-btn:hover { background: rgba(4,198,233,0.15); }

                .msg-edit-wrap { display: flex; flex-direction: column; gap: 6px; width: 100%; }
                .msg-edit-input {
                    width: 100%; min-width: 200px; background: rgba(10,20,35,0.8);
                    border: 1px solid rgba(4,198,233,0.3); border-radius: 8px;
                    color: rgb(220,235,250); padding: 0.4rem 0.6rem; font-size: 0.9rem;
                    font-family: inherit; resize: none; outline: none; box-sizing: border-box;
                }
                .msg-edit-input:focus { border-color: var(--logo-color); }
                .msg-edit-actions { display: flex; gap: 6px; }
                .msg-btn-save {
                    padding: 3px 10px; background: var(--logo-color); border: none;
                    border-radius: 6px; color: #0a0f18; font-weight: 700; font-size: 0.78rem;
                    cursor: pointer; font-family: inherit; transition: background 0.15s;
                }
                .msg-btn-save:hover { background: rgb(3,220,255); }
                .msg-btn-cancel {
                    padding: 3px 10px; background: transparent;
                    border: 1px solid rgba(150,170,190,0.25); border-radius: 6px;
                    color: rgba(180,200,220,0.7); font-size: 0.78rem; cursor: pointer;
                    font-family: inherit; transition: border-color 0.15s, color 0.15s;
                }
                .msg-btn-cancel:hover { border-color: rgba(150,170,190,0.5); color: rgb(200,220,240); }

                .msg-input-row {
                    display: flex; align-items: flex-end; gap: 8px;
                    padding: 0.75rem 1.1rem; border-top: 1px solid rgba(4,198,233,0.1); flex-shrink: 0;
                }
                .msg-input {
                    flex: 1; background: rgba(10,20,35,0.6);
                    border: 1px solid rgba(4,198,233,0.2); border-radius: 10px;
                    color: rgb(220,235,250); padding: 0.55rem 0.9rem;
                    font-size: 0.9rem; font-family: inherit; resize: none; outline: none;
                    line-height: 1.45; max-height: 100px; overflow-y: auto;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .msg-input:focus { border-color: var(--logo-color); box-shadow: 0 0 0 3px rgba(4,198,233,0.1); }
                .msg-input:disabled { opacity: 0.4; cursor: not-allowed; }
                .msg-send-btn {
                    background: var(--logo-color); border: none; border-radius: 10px;
                    color: #0a0f18; font-size: 1.1rem; width: 40px; height: 40px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; transition: background 0.15s, transform 0.1s;
                }
                .msg-send-btn:hover:not(:disabled) { background: rgb(3,220,255); transform: scale(1.05); }
                .msg-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

                @media (max-width: 640px) {
                    .msg-layout { flex-direction: column; height: auto; min-height: 0; }
                    .msg-sidebar { width: 100%; border-right: none; border-bottom: 1px solid rgba(4,198,233,0.1); max-height: 200px; overflow-y: auto; }
                    .msg-window { min-height: 400px; }
                }
            `}</style>
        </main>
    );
}