import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getMyChats, getChatMessages, getWsUrl } from "../api/Messanger.js";

/* ---------- helpers ---------- */
function timeAgo(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr + "Z"); // treat as UTC
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

/* ---------- component ---------- */
export default function Messanger() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [chats, setChats] = useState([]);
    const [activeChatUuid, setActiveChatUuid] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [wsStatus, setWsStatus] = useState("disconnected"); // connecting | open | disconnected | error
    const [wsError, setWsError] = useState(null);

    const wsRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const myId = getCurrentUserId();

    /* ---- load chat list ---- */
    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        (async () => {
            setLoadingChats(true);
            const data = await getMyChats();
            setChats(data);
            setLoadingChats(false);
        })();
    }, [user]);

    /* ---- open chat ---- */
    const openChat = useCallback(async (chatUuid) => {
        if (activeChatUuid === chatUuid) return;

        // close previous WS
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }

        setActiveChatUuid(chatUuid);
        setMessages([]);
        setWsError(null);
        setLoadingMessages(true);

        try {
            const data = await getChatMessages(chatUuid);
            // backend orders DESC, reverse to oldest-first for display
            setMessages(Array.isArray(data) ? [...data].reverse() : []);
        } catch {
            setMessages([]);
        }
        setLoadingMessages(false);

        // open WS
        const ws = new WebSocket(getWsUrl(chatUuid));
        wsRef.current = ws;
        setWsStatus("connecting");

        ws.onopen = () => { setWsStatus("open"); setWsError(null); };
        ws.onclose = (e) => {
            setWsStatus("disconnected");
            if (e.code !== 1000) setWsError(`Соединение закрыто (код ${e.code})`);
        };
        ws.onerror = () => {
            setWsStatus("error");
            setWsError("Не удалось подключиться к чату. Проверьте, что сервер запущен и попробуйте снова.");
        };

        ws.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            if (payload.response_type === "message_created") {
                setMessages(prev => [...prev, {
                    chat_id: null,
                    message: payload.message,
                    created_at: payload.created_at,
                    user: { id: payload.user_id, username: null },
                    _id: payload.message_id,
                }]);
            } else if (payload.response_type === "message_edited") {
                setMessages(prev => prev.map(m =>
                    (m._id === payload.message_id || m.id === payload.message_id)
                        ? { ...m, message: payload.message }
                        : m
                ));
            } else if (payload.response_type === "message_deleted") {
                setMessages(prev => prev.filter(m =>
                    m._id !== payload.message_id && m.id !== payload.message_id
                ));
            }
        };
    }, [activeChatUuid]);

    /* ---- scroll to bottom on new messages ---- */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ---- send message ---- */
    const sendMessage = () => {
        if (!inputText.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: "new_message", message: inputText.trim() }));
        setInputText("");
        inputRef.current?.focus();
    };

    /* ---- edit message ---- */
    const submitEdit = (msgId) => {
        if (!editText.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: "edit_message", message_id: msgId, message: editText.trim() }));
        setEditingId(null);
        setEditText("");
    };

    /* ---- delete message ---- */
    const deleteMsg = (msgId) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: "delete_message", message_id: msgId }));
    };

    /* ---- cleanup on unmount ---- */
    useEffect(() => () => {
        if (wsRef.current) wsRef.current.close();
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const wsColor = wsStatus === "open" ? "#04c6e9" : wsStatus === "connecting" ? "#f0a500" : wsStatus === "error" ? "#ff7070" : "#666";

    return (
        <main style={{ padding: "2rem var(--body-padding)", flex: 1 }}>
            <h1 style={{ marginBottom: "1.5rem", fontSize: "1.6rem", color: "var(--main-text-color)" }}>
                Сообщения
            </h1>

            <div className="msg-layout">
                {/* ===== chat list ===== */}
                <aside className="msg-sidebar">
                    <div className="msg-sidebar-header">Чаты</div>
                    {loadingChats ? (
                        <div className="msg-empty">Загрузка…</div>
                    ) : chats.length === 0 ? (
                        <div className="msg-empty">Нет чатов</div>
                    ) : (
                        chats.map(({ chat, last_message_user }) => (
                            <button
                                key={chat.uuid}
                                className={`msg-chat-item${activeChatUuid === chat.uuid ? " active" : ""}`}
                                onClick={() => openChat(chat.uuid)}
                            >
                                <div className="msg-chat-name">
                                    {last_message_user
                                        ? last_message_user.username
                                        : chat.uuid.slice(0, 8)}
                                </div>
                                {chat.last_message_text && (
                                    <div className="msg-chat-preview">{chat.last_message_text}</div>
                                )}
                                {chat.last_message_created_at && (
                                    <div className="msg-chat-time">{timeAgo(chat.last_message_created_at)}</div>
                                )}
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
                                <span
                                    title={`WebSocket: ${wsStatus}`}
                                    style={{
                                        display: "inline-block",
                                        width: 9, height: 9,
                                        borderRadius: "50%",
                                        background: wsColor,
                                        marginRight: 8,
                                        boxShadow: wsStatus === "open" ? `0 0 6px ${wsColor}` : "none",
                                        transition: "background 0.3s",
                                    }}
                                />
                                {chats.find(c => c.chat.uuid === activeChatUuid)?.last_message_user?.username
                                    ?? activeChatUuid.slice(0, 8)}
                            </div>
                            {wsError && (
                                <div style={{
                                    padding: "0.5rem 1.25rem",
                                    fontSize: "0.8rem",
                                    color: "#ff7070",
                                    background: "rgba(255,80,80,0.07)",
                                    borderBottom: "1px solid rgba(255,80,80,0.15)",
                                }}>
                                    ⚠️ {wsError}
                                </div>
                            )}

                            <div className="msg-messages">
                                {loadingMessages ? (
                                    <div className="msg-empty">Загрузка сообщений…</div>
                                ) : messages.length === 0 ? (
                                    <div className="msg-empty">Нет сообщений. Напишите первым!</div>
                                ) : (
                                    messages.map((m, idx) => {
                                        const msgId = m._id ?? m.id ?? idx;
                                        const isMine = m.user?.id === myId;
                                        return (
                                            <div
                                                key={msgId}
                                                className={`msg-bubble-wrap${isMine ? " mine" : ""}`}
                                            >
                                                {!isMine && (
                                                    <div className="msg-username">{m.user?.username}</div>
                                                )}
                                                {editingId === msgId ? (
                                                    <div className="msg-edit-wrap">
                                                        <textarea
                                                            className="msg-edit-input"
                                                            value={editText}
                                                            onChange={e => setEditText(e.target.value)}
                                                            autoFocus
                                                            onKeyDown={e => {
                                                                if (e.key === "Enter" && !e.shiftKey) {
                                                                    e.preventDefault(); submitEdit(msgId);
                                                                }
                                                                if (e.key === "Escape") {
                                                                    setEditingId(null); setEditText("");
                                                                }
                                                            }}
                                                        />
                                                        <div className="msg-edit-actions">
                                                            <button
                                                                className="msg-btn-save"
                                                                onClick={() => submitEdit(msgId)}
                                                            >Сохранить</button>
                                                            <button
                                                                className="msg-btn-cancel"
                                                                onClick={() => { setEditingId(null); setEditText(""); }}
                                                            >Отмена</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="msg-bubble">
                                                        <span className="msg-text">{m.message}</span>
                                                        <span className="msg-meta">
                                                            {timeAgo(m.created_at)}
                                                        </span>
                                                        {isMine && (
                                                            <div className="msg-actions">
                                                                <button
                                                                    className="msg-act-btn"
                                                                    title="Редактировать"
                                                                    onClick={() => {
                                                                        setEditingId(msgId);
                                                                        setEditText(m.message);
                                                                    }}
                                                                >✏️</button>
                                                                <button
                                                                    className="msg-act-btn"
                                                                    title="Удалить"
                                                                    onClick={() => deleteMsg(msgId)}
                                                                >🗑️</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={bottomRef} />
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
                                    disabled={wsStatus !== "open"}
                                />
                                <button
                                    className="msg-send-btn"
                                    onClick={sendMessage}
                                    disabled={wsStatus !== "open" || !inputText.trim()}
                                    title="Отправить"
                                >
                                    ➤
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>

            <style>{`
                .msg-layout {
                    display: flex;
                    height: calc(100vh - 220px);
                    min-height: 420px;
                    border: 1px solid rgba(4,198,233,0.15);
                    border-radius: 14px;
                    overflow: hidden;
                    background: #161b24;
                }

                /* sidebar */
                .msg-sidebar {
                    width: 280px;
                    min-width: 200px;
                    border-right: 1px solid rgba(4,198,233,0.1);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .msg-sidebar-header {
                    padding: 1rem 1.1rem 0.75rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(4,198,233,0.7);
                    border-bottom: 1px solid rgba(4,198,233,0.1);
                    flex-shrink: 0;
                }
                .msg-chat-item {
                    width: 100%;
                    background: none;
                    border: none;
                    text-align: left;
                    padding: 0.85rem 1.1rem;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    color: var(--main-text-color);
                    transition: background 0.15s;
                    overflow: hidden;
                }
                .msg-chat-item:hover { background: rgba(4,198,233,0.06); }
                .msg-chat-item.active { background: rgba(4,198,233,0.12); }
                .msg-chat-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: rgb(210,240,255);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .msg-chat-preview {
                    font-size: 0.78rem;
                    color: rgba(200,220,240,0.5);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-top: 2px;
                }
                .msg-chat-time {
                    font-size: 0.72rem;
                    color: rgba(150,170,190,0.45);
                    margin-top: 2px;
                }

                /* window */
                .msg-window {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .msg-window-header {
                    padding: 0.85rem 1.25rem;
                    border-bottom: 1px solid rgba(4,198,233,0.1);
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: rgb(180,220,255);
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                }
                .msg-placeholder {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(150,170,190,0.35);
                    font-size: 0.95rem;
                    letter-spacing: 0.04em;
                }
                .msg-empty {
                    padding: 1.25rem;
                    color: rgba(150,170,190,0.4);
                    font-size: 0.85rem;
                    text-align: center;
                }
                .msg-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.55rem;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(4,198,233,0.2) transparent;
                }

                /* bubbles */
                .msg-bubble-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    max-width: 70%;
                }
                .msg-bubble-wrap.mine { align-self: flex-end; align-items: flex-end; }
                .msg-username {
                    font-size: 0.72rem;
                    font-weight: 600;
                    color: rgba(4,198,233,0.6);
                    margin-bottom: 2px;
                    padding-left: 2px;
                }
                .msg-bubble {
                    position: relative;
                    background: rgba(30,40,55,0.85);
                    border: 1px solid rgba(4,198,233,0.1);
                    border-radius: 12px;
                    padding: 0.55rem 0.85rem 0.5rem;
                    display: inline-flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .msg-bubble-wrap.mine .msg-bubble {
                    background: rgba(4,60,75,0.7);
                    border-color: rgba(4,198,233,0.22);
                }
                .msg-text {
                    font-size: 0.9rem;
                    line-height: 1.45;
                    color: rgb(220,235,250);
                    word-break: break-word;
                    white-space: pre-wrap;
                }
                .msg-meta {
                    font-size: 0.7rem;
                    color: rgba(150,170,190,0.45);
                    align-self: flex-end;
                }
                .msg-actions {
                    display: none;
                    gap: 4px;
                    position: absolute;
                    top: -10px;
                    right: 4px;
                }
                .msg-bubble:hover .msg-actions { display: flex; }
                .msg-act-btn {
                    background: rgba(20,30,45,0.95);
                    border: 1px solid rgba(4,198,233,0.2);
                    border-radius: 6px;
                    padding: 2px 5px;
                    cursor: pointer;
                    font-size: 0.78rem;
                    line-height: 1;
                    transition: background 0.15s;
                }
                .msg-act-btn:hover { background: rgba(4,198,233,0.15); }

                /* edit */
                .msg-edit-wrap { display: flex; flex-direction: column; gap: 6px; width: 100%; }
                .msg-edit-input {
                    width: 100%;
                    min-width: 200px;
                    background: rgba(10,20,35,0.8);
                    border: 1px solid rgba(4,198,233,0.3);
                    border-radius: 8px;
                    color: rgb(220,235,250);
                    padding: 0.4rem 0.6rem;
                    font-size: 0.9rem;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                    box-sizing: border-box;
                }
                .msg-edit-input:focus { border-color: var(--logo-color); }
                .msg-edit-actions { display: flex; gap: 6px; }
                .msg-btn-save {
                    padding: 3px 10px;
                    background: var(--logo-color);
                    border: none;
                    border-radius: 6px;
                    color: #0a0f18;
                    font-weight: 700;
                    font-size: 0.78rem;
                    cursor: pointer;
                    font-family: inherit;
                    transition: background 0.15s;
                }
                .msg-btn-save:hover { background: rgb(3,220,255); }
                .msg-btn-cancel {
                    padding: 3px 10px;
                    background: transparent;
                    border: 1px solid rgba(150,170,190,0.25);
                    border-radius: 6px;
                    color: rgba(180,200,220,0.7);
                    font-size: 0.78rem;
                    cursor: pointer;
                    font-family: inherit;
                    transition: border-color 0.15s, color 0.15s;
                }
                .msg-btn-cancel:hover { border-color: rgba(150,170,190,0.5); color: rgb(200,220,240); }

                /* input row */
                .msg-input-row {
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                    padding: 0.75rem 1.1rem;
                    border-top: 1px solid rgba(4,198,233,0.1);
                    flex-shrink: 0;
                }
                .msg-input {
                    flex: 1;
                    background: rgba(10,20,35,0.6);
                    border: 1px solid rgba(4,198,233,0.2);
                    border-radius: 10px;
                    color: rgb(220,235,250);
                    padding: 0.55rem 0.9rem;
                    font-size: 0.9rem;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                    line-height: 1.45;
                    max-height: 100px;
                    overflow-y: auto;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .msg-input:focus {
                    border-color: var(--logo-color);
                    box-shadow: 0 0 0 3px rgba(4,198,233,0.1);
                }
                .msg-input:disabled { opacity: 0.4; cursor: not-allowed; }
                .msg-send-btn {
                    background: var(--logo-color);
                    border: none;
                    border-radius: 10px;
                    color: #0a0f18;
                    font-size: 1.1rem;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: background 0.15s, transform 0.1s;
                }
                .msg-send-btn:hover:not(:disabled) { background: rgb(3,220,255); transform: scale(1.05); }
                .msg-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

                @media (max-width: 640px) {
                    .msg-layout { flex-direction: column; height: auto; min-height: 0; }
                    .msg-sidebar { width: 100%; border-right: none; border-bottom: 1px solid rgba(4,198,233,0.1); max-height: 180px; overflow-y: auto; }
                    .msg-window { min-height: 400px; }
                }
            `}</style>
        </main>
    );
}